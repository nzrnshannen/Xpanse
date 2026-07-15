from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship
from app.models.bridges import SpaceMemberLink, BoardMemberLink, RoomMemberLink, NoteCollaboratorLink

class User(SQLModel, table=True):
    """
    User database model representing account credentials and profiles.
    """
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    hashed_password: str

    # Relational Links
    owned_spaces: List["Space"] = Relationship(
        back_populates="owner", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    spaces: List["Space"] = Relationship(back_populates="members", link_model=SpaceMemberLink)
    boards: List["Board"] = Relationship(back_populates="members", link_model=BoardMemberLink)
    rooms: List["Room"] = Relationship(back_populates="members", link_model=RoomMemberLink)
    notes: List["Note"] = Relationship(back_populates="collaborators", link_model=NoteCollaboratorLink)

class Space(SQLModel, table=True):
    """
    Space represents the macro-container for the entire organization.
    """
    __tablename__ = "spaces"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    owner_id: int = Field(foreign_key="users.id", ondelete="CASCADE")

    # Relational Links
    owner: User = Relationship(back_populates="owned_spaces")
    members: List[User] = Relationship(back_populates="spaces", link_model=SpaceMemberLink)
    
    boards: List["Board"] = Relationship(
        back_populates="space", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    rooms: List["Room"] = Relationship(
        back_populates="space", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    notes: List["Note"] = Relationship(
        back_populates="space",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class Board(SQLModel, table=True):
    """
    Board represents Kanban project tasks built natively inside a space.
    """
    __tablename__ = "boards"

    id: Optional[int] = Field(default=None, primary_key=True)
    space_id: int = Field(foreign_key="spaces.id", ondelete="CASCADE")
    name: str

    # Relational Links
    space: Space = Relationship(back_populates="boards")
    members: List[User] = Relationship(back_populates="boards", link_model=BoardMemberLink)
    columns: List["BoardColumn"] = Relationship(
        back_populates="board",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "BoardColumn.position"}
    )

class BoardColumn(SQLModel, table=True):
    """
    BoardColumn represents a dynamic status column in a Kanban board.
    """
    __tablename__ = "board_columns"

    id: Optional[int] = Field(default=None, primary_key=True)
    board_id: int = Field(foreign_key="boards.id", ondelete="CASCADE")
    name: str
    position: int = Field(default=0)

    # Relational Links
    board: Board = Relationship(back_populates="columns")
    tasks: List["Task"] = Relationship(
        back_populates="column",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "Task.position"}
    )

class Task(SQLModel, table=True):
    """
    Task represents an individual card within a Kanban board column.
    """
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    column_id: int = Field(foreign_key="board_columns.id", ondelete="CASCADE")
    title: str
    description: Optional[str] = None
    position: int = Field(default=0)
    category: Optional[str] = Field(default="Task")

    # Relational Links
    column: BoardColumn = Relationship(back_populates="tasks")

class Room(SQLModel, table=True):
    """
    Room represents real-time communications channels (group or direct chats).
    """
    __tablename__ = "rooms"

    id: Optional[int] = Field(default=None, primary_key=True)
    space_id: int = Field(foreign_key="spaces.id", ondelete="CASCADE")
    name: str
    type: str = Field(default="group")  # "group" or "direct"

    # Relational Links
    space: Space = Relationship(back_populates="rooms")
    members: List[User] = Relationship(back_populates="rooms", link_model=RoomMemberLink)

class Note(SQLModel, table=True):
    """
    Note represents collaborative text documents inside a space.
    """
    __tablename__ = "notes"

    id: Optional[int] = Field(default=None, primary_key=True)
    space_id: int = Field(foreign_key="spaces.id", ondelete="CASCADE")
    owner_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    title: str

    # Relational Links
    space: Space = Relationship(back_populates="notes")
    owner: User = Relationship()
    collaborators: List[User] = Relationship(back_populates="notes", link_model=NoteCollaboratorLink)
    chapters: List["NoteChapter"] = Relationship(
        back_populates="note", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "NoteChapter.order_index"}
    )

class NoteChapter(SQLModel, table=True):
    """
    NoteChapter represents an individual tab/chapter within a Note.
    """
    __tablename__ = "note_chapters"

    id: Optional[int] = Field(default=None, primary_key=True)
    note_id: int = Field(foreign_key="notes.id", ondelete="CASCADE")
    title: str
    content: str = Field(default="")
    order_index: int = Field(default=0)

    # Relational Links
    note: Note = Relationship(back_populates="chapters")
