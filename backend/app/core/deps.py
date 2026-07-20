from typing import Annotated
from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.user import User


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador",
        )
    return user


AdminUser = Annotated[User, Depends(require_admin)]
