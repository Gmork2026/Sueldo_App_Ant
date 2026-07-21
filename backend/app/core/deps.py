from typing import Annotated
from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.user import User


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador",
        )
    return user


AdminUser = Annotated[User, Depends(require_admin)]


async def require_superadmin(user: CurrentUser) -> User:
    if user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de super administrador",
        )
    return user


SuperAdminUser = Annotated[User, Depends(require_superadmin)]
