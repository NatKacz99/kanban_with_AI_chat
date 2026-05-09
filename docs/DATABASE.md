# Database approach (MVP)

## Goal
Persist a single Kanban board per user (MVP) in SQLite, created on first run if it does not exist.

## Storage engine
- SQLite (local file)
- One database file for local development and the Docker container

## Entities
### Users
- Stores basic user identity for future multi-user support (MVP has one hardcoded user).
- Fields:
  - id (integer, primary key)
  - username (text, unique, required)
  - created_at (datetime)

### Boards
- One board per user in MVP.
- Fields:
  - id (integer, primary key)
  - user_id (integer, foreign key -> users.id)
  - name (text)
  - created_at (datetime)

### Columns
- Fixed set per board; names can be edited.
- Fields:
  - id (integer, primary key)
  - board_id (integer, foreign key -> boards.id)
  - title (text)
  - position (integer)  
  - created_at (datetime)

### Cards
- Cards belong to a column; ordering by position.
- Fields:
  - id (integer, primary key)
  - column_id (integer, foreign key -> columns.id)
  - title (text)
  - description (text)
  - position (integer)
  - created_at (datetime)
  - updated_at (datetime)

## Relationships
- users 1—1 boards (MVP)
- boards 1—N columns
- columns 1—N cards

## Notes
- Positions are integers for stable ordering inside a column.
- For MVP, keep schema minimal (no extra features).

## JSON schema file (to be created by user)
The schema should be saved as a JSON document describing the tables, fields, and relationships above. Use a simple structure such as:
- top-level "tables" array
- each table has name and fields
- fields include name, type, and constraints
- optional "relationships" array for foreign keys

## Success criteria
- The JSON schema file exists in docs/ (user-created).
- Documentation reflects the minimal MVP schema and SQLite approach.
