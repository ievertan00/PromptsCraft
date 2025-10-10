import pandas as pd
import sqlite3
import json
import os

def import_excel_to_database(excel_file_path, db_path='prompts.db'):
    """
    Import data from an Excel file to the PromptsCraft SQLite database.
    
    Args:
        excel_file_path (str): Path to the Excel file with columns [ParentFolder, Folder, Title, Prompt]
        db_path (str): Path to the SQLite database file
    """
    
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables if they don't exist 
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER,
            sort_order INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES folders(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            prompt TEXT,
            description TEXT,
            tags TEXT,
            folder_id INTEGER,
            is_favorite INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (folder_id) REFERENCES folders(id)
        )
    ''')
    
    try:
        # Read the Excel file
        print(f"Reading Excel file: {excel_file_path}")
        df = pd.read_excel(excel_file_path)
        
        print(f"Found {len(df)} rows in the Excel file")
        print(f"Columns in the Excel file: {list(df.columns)}")
        
        # Verify that the Excel has the expected 4 columns
        expected_columns = ['ParentFolder', 'Folder', 'Title', 'Prompt']
        
        # If the columns don't match exactly, try to map them by position
        if list(df.columns) != expected_columns:
            print("Column names don't match expected names. Mapping by position...")
            if len(df.columns) >= 4:
                df.columns = expected_columns
                print(f"Renamed columns to: {expected_columns}")
            else:
                print(f"Error: Expected 4 columns but found {len(df.columns)}")
                return
        
        # Process each row in the Excel file
        for index, row in df.iterrows():
            parent_folder_name = str(row['ParentFolder']) if pd.notna(row['ParentFolder']) else 'Default Parent'
            folder_name = str(row['Folder']) if pd.notna(row['Folder']) else 'Default Folder'
            title = str(row['Title']) if pd.notna(row['Title']) else ''
            prompt_content = str(row['Prompt']) if pd.notna(row['Prompt']) else ''
            
            # Skip rows where both title and prompt are empty
            if not title.strip() and not prompt_content.strip():
                print(f"Skipping row {index + 1}: both title and prompt are empty")
                continue
            
            # Step 1: Create or find parent folder with parent_id = NULL
            cursor.execute("SELECT id FROM folders WHERE name = ? AND parent_id IS NULL", (parent_folder_name,))
            parent_folder_result = cursor.fetchone()
            
            if parent_folder_result:
                parent_folder_id = parent_folder_result[0]
                print(f"Found existing parent folder: '{parent_folder_name}' with ID {parent_folder_id}")
            else:
                cursor.execute(
                    "INSERT INTO folders (name, parent_id, sort_order) VALUES (?, NULL, ?)",
                    (parent_folder_name, index + 1)
                )
                parent_folder_id = cursor.lastrowid
                print(f"Created new parent folder: '{parent_folder_name}' with ID {parent_folder_id}")
            
            # Step 2: Create or find child folder with parent_id = parent_folder_id
            cursor.execute("SELECT id FROM folders WHERE name = ? AND parent_id = ?", (folder_name, parent_folder_id))
            folder_result = cursor.fetchone()
            
            if folder_result:
                folder_id = folder_result[0]
                print(f"Found existing folder: '{folder_name}' under parent ID {parent_folder_id} with ID {folder_id}")
            else:
                cursor.execute(
                    "INSERT INTO folders (name, parent_id, sort_order) VALUES (?, ?, ?)",
                    (folder_name, parent_folder_id, index + 1)
                )
                folder_id = cursor.lastrowid
                print(f"Created new folder: '{folder_name}' under parent ID {parent_folder_id} with ID {folder_id}")
            
            # Step 3: Create prompt with folder_id = folder_id
            cursor.execute('''
                INSERT INTO prompts (title, prompt, description, tags, folder_id)
                VALUES (?, ?, ?, ?, ?)
            ''', (title, prompt_content, '', '[]', folder_id))
            
            print(f"Inserted prompt: '{title[:30]}...' into folder '{folder_name}' (ID: {folder_id})")
        
        # Commit the changes
        conn.commit()
        print(f"\nSuccessfully imported {len(df)} rows to the database!")
        
        # Print summary
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
        # Close the database connection
        conn.close()

def main():
    # Path to your Excel file
    excel_file = 'ChatGPTPromptsPacks.xlsx'
    
    # Check if the Excel file exists
    if not os.path.exists(excel_file):
        print(f"Excel file {excel_file} not found in the current directory!")
        print("Please ensure the Excel file is in the same directory as this script.")
        return
    
    print("Starting import process...")
    import_excel_to_database(excel_file)

if __name__ == "__main__":
    main()