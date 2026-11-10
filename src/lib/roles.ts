import type { UsuarioOut } from './api'

/** Espejo de deps.py: owner/superadmin configuran; member opera; vendedor/proveedor ven lo suyo. */
export const esGerencia = (u: UsuarioOut | null) => u?.role === 'owner' || u?.role === 'superadmin'
export const esDeNegocio = (u: UsuarioOut | null) => esGerencia(u) || u?.role === 'member'
export const esVendedor = (u: UsuarioOut | null) => u?.role === 'vendedor'
export const esProveedor = (u: UsuarioOut | null) => u?.role === 'proveedor'
