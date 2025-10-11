import pandas as pd
import sqlite3
import json
from pathlib import Path
import argparse

def import_excel_to_database(excel_file_path: str, db_path: str):
    """
    Import data from an Excel file to the PromptsCraft SQLite database.

    Args:
        excel_file_path (str): Path to the Excel file with columns [ParentFolder, Folder, Title, Prompt]
        db_path (str): Path to the SQLite database file
    """
    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # The CREATE TABLE statements should match the Node.js app's schema
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER,
            sort_order INTEGER,
            FOREIGN KEY (parent_id) REFERENCES folders(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            prompt TEXT,
            tags TEXT,
            folder_id INTEGER,
            is_favorite INTEGER DEFAULT 0,
            FOREIGN KEY (folder_id) REFERENCES folders(id)
        )
    ''')

    try:
        print(f"Reading Excel file: {excel_file_path}")
        df = pd.read_excel(excel_file_path)

        print(f"Found {len(df)} rows in the Excel file")
        print(f"Columns in the Excel file: {list(df.columns)}")

        expected_columns = ['ParentFolder', 'Folder', 'Title', 'Prompt']
        if list(df.columns) != expected_columns:
            print("Column names don't match expected names. Mapping by position...")
            if len(df.columns) >= 4:
                df.columns = expected_columns + list(df.columns)[4:]
                print(f"Renamed first 4 columns to: {expected_columns}")
            else:
                print(f"Error: Expected at least 4 columns but found {len(df.columns)}")
                return

        for index, row in df.iterrows():
            parent_folder_name = str(row['ParentFolder']) if pd.notna(row['ParentFolder']) else 'Default Parent'
            folder_name = str(row['Folder']) if pd.notna(row['Folder']) else 'Default Folder'
            title = str(row['Title']) if pd.notna(row['Title']) else ''
            prompt_content = str(row['Prompt']) if pd.notna(row['Prompt']) else ''

            if not title.strip() and not prompt_content.strip():
                print(f"Skipping row {index + 1}: both title and prompt are empty")
                continue

            cursor.execute("SELECT id FROM folders WHERE name = ? AND parent_id IS NULL", (parent_folder_name,))
            parent_folder_result = cursor.fetchone()

            if parent_folder_result:
                parent_folder_id = parent_folder_result[0]
            else:
                cursor.execute(
                    "INSERT INTO folders (name, parent_id, sort_order) VALUES (?, NULL, ?)",
                    (parent_folder_name, index + 1)
                )
                parent_folder_id = cursor.lastrowid

            cursor.execute("SELECT id FROM folders WHERE name = ? AND parent_id = ?", (folder_name, parent_folder_id))
            folder_result = cursor.fetchone()

            if folder_result:
                folder_id = folder_result[0]
            else:
                cursor.execute(
                    "INSERT INTO folders (name, parent_id, sort_order) VALUES (?, ?, ?)",
                    (folder_name, parent_folder_id, index + 1)
                )
                folder_id = cursor.lastrowid

            # Updated INSERT statement to match the new schema (no 'description')
            cursor.execute('''
                INSERT INTO prompts (title, prompt, tags, folder_id)
                VALUES (?, ?, ?, ?)
            ''', (title, prompt_content, '[]', folder_id))

            print(f"Inserted prompt: '{title[:30]}...' into folder '{folder_name}'")

        conn.commit()
        print(f"\nSuccessfully imported {len(df)} rows to the database!")

        cursor.execute("SELECT COUNT(*) FROM prompts")
        total_prompts = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM folders")
        total_folders = cursor.fetchone()[0]

        print(f"Total prompts in database after import: {total_prompts}")
        print(f"Total folders in database after import: {total_folders}")

    except Exception as e:
        print(f"Error during import: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

def main():
    # Get the directory where the script is located
    script_dir = Path(__file__).parent

    # Set up default paths relative to the script's location
    default_db_path = script_dir / ".." / "packages" / "server" / "prompts.db"
    default_excel_path = script_dir / "ChatGPTPromptsPacks.xlsx"

    parser = argparse.ArgumentParser(description="Import prompts from an Excel file to the PromptsCraft database.")
    parser.add_argument("excel_file", nargs='?', default=str(default_excel_path),
                        help=f"Path to the Excel file. Defaults to {default_excel_path}")
    parser.add_argument("--db", default=str(default_db_path),
                        help=f"Path to the SQLite database file. Defaults to {default_db_path}")

    args = parser.parse_args()

    excel_file_path = Path(args.excel_file)
    db_path = Path(args.db).resolve()

    if not excel_file_path.exists():
        print(f"Error: Excel file not found at {excel_file_path}")
        return

    print("Starting import process...")
    import_excel_to_database(str(excel_file_path), str(db_path))

if __name__ == "__main__":
    main()
