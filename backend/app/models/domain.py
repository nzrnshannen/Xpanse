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
    content: str = Field(default="")

    # Relational Links
    space: Space = Relationship(back_populates="notes")
    owner: User = Relationship()
    collaborators: List[User] = Relationship(back_populates="notes", link_model=NoteCollaboratorLink)
