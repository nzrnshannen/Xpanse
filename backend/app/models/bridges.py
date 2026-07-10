from sqlmodel import SQLModel, Field

class SpaceMemberLink(SQLModel, table=True):
    """
    Bridge table for User-to-Space membership relation.
    """
    __tablename__ = "space_members"

    space_id: int = Field(foreign_key="spaces.id", primary_key=True, ondelete="CASCADE")
    user_id: int = Field(foreign_key="users.id", primary_key=True, ondelete="CASCADE")


class BoardMemberLink(SQLModel, table=True):
    """
    Bridge table for User-to-Board membership relation.
    """
    __tablename__ = "board_members"

    board_id: int = Field(foreign_key="boards.id", primary_key=True, ondelete="CASCADE")
    user_id: int = Field(foreign_key="users.id", primary_key=True, ondelete="CASCADE")


class RoomMemberLink(SQLModel, table=True):
    """
    Bridge table for User-to-Room membership relation.
    """
    __tablename__ = "room_members"

    room_id: int = Field(foreign_key="rooms.id", primary_key=True, ondelete="CASCADE")
    user_id: int = Field(foreign_key="users.id", primary_key=True, ondelete="CASCADE")
