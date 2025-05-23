import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isAuthenticated = computed(() => !!token.value);

  // Propiedad computada para verificar si es cualquier tipo de administrador
  const isAdmin = computed(() => {
    if (!user.value?.permissions) {
      return false;
    }
    // Verificar si tiene cualquier rol de administrador (antiguo o nuevo)
    return user.value.permissions.includes('ROLE_ADMIN') || 
           user.value.permissions.includes('ROLE_ADMIN_SISTEMA') ||
           user.value.permissions.includes('ROLE_ADMIN_USUARIOS') ||
           user.value.permissions.includes('ROLE_ADMIN_VETERINARIA');
  });

  // Propiedad computada para verificar si es administrador del sistema
  const isAdminSistema = computed(() => {
    if (!user.value?.permissions) {
      return false;
    }
    return user.value.permissions.includes('ROLE_ADMIN_SISTEMA');
  });

  // Propiedad computada para verificar si es administrador de usuarios
  const isAdminUsuarios = computed(() => {
    if (!user.value?.permissions) {
      return false;
    }
    return user.value.permissions.includes('ROLE_ADMIN_USUARIOS') || user.value.permissions.includes('ROLE_ADMIN_SISTEMA');
  });

  // Propiedad computada para verificar si es administrador veterinario
  const isAdminVeterinaria = computed(() => {
    if (!user.value?.permissions) {
      return false;
    }
    return user.value.permissions.includes('ROLE_ADMIN_VETERINARIA') || user.value.permissions.includes('ROLE_ADMIN_SISTEMA');
  });

  // Propiedad computada para verificar si es cualquier tipo de veterinario
  const isVeterinario = computed(() => {
    if (!user.value?.permissions) {
      return false;
    }
    return user.value.permissions.includes('ROLE_VETERINARIO') || 
           user.value.permissions.includes('ROLE_VETERINARIO_SENIOR') || 
           user.value.permissions.includes('ROLE_VETERINARIO_JUNIOR');
  });

  // Propiedad computada para verificar si es gerente
  const isGerente = computed(() => {
    if (!user.value?.permissions) {
      return false;
    }
    return user.value.permissions.includes('ROLE_GERENTE');
  });

  // Propiedad computada para verificar si es recepcionista
  const isRecepcionista = computed(() => {
    if (!user.value?.permissions) {
      return false;
    }
    return user.value.permissions.includes('ROLE_RECEPCIONISTA');
  });

  // Propiedad computada para verificar si es asistente
  const isAsistente = computed(() => {
    if (!user.value?.permissions) {
      return false;
    }
    return user.value.permissions.includes('ROLE_ASISTENTE');
  });

  // Propiedad computada para verificar si es consultor de datos
  const isConsultorDatos = computed(() => {
    if (!user.value?.permissions) {
      return false;
    }
    return user.value.permissions.includes('ROLE_CONSULTOR_DATOS');
  });

  async function login(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials);

      // Imprimir la respuesta completa para depuración
      console.log('Respuesta completa:', response);

      // Usar directamente response.data ya que esa es la estructura
      const authData = response.data;

      // Verificar que tengamos al menos un token
      if (!authData || !authData.token) {
        console.error('Token no encontrado en la respuesta:', authData);
        throw new Error('Token no encontrado en la respuesta');
      }

      token.value = authData.token;

      // Los permisos ahora vienen directamente como un array de strings
      const permissions = authData.roles || [];

      user.value = {
        nombreUsuario: authData.nombreUsuario || credentials.nombreUsuario,
        // Guardar los permisos tal cual vienen ahora (ya son strings)
        permissions: permissions,
        // Mantener roles para compatibilidad
        roles: permissions,
        // Almacenar el nombre del rol principal
        rolNombre: authData.rolNombre || ''
      };

      localStorage.setItem('token', authData.token);
      // Guardar el objeto user con sus permisos
      localStorage.setItem('user', JSON.stringify(user.value));

      // Configurar el token para las próximas solicitudes
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

      // Opcional: Manejar passwordChangeRequired si es necesario
      if (authData.passwordChangeRequired) {
        console.warn('El usuario debe cambiar su contraseña.');
        // Podrías redirigir a una página de cambio de contraseña aquí
      }

      return authData; // Devolver la respuesta completa por si se necesita algo más
    } catch (error) {
      console.error('Error de login:', error);
      console.error('Detalles de la respuesta:', error.response?.data);
      throw new Error(error.response?.data?.mensaje || 'Error al iniciar sesión');
    }
  }

  // Función para verificar permisos (no necesita cambios ya que sigue funcionando con strings)
  function hasPermission(permissionName) {
    // Si el usuario no existe o no tiene permisos
    if (!user.value || !user.value.permissions) {
      return false;
    }
    
    // Verificar si el usuario tiene el permiso específico
    return user.value.permissions.includes(permissionName);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }

  // Si ya hay un token, configurarlo para las solicitudes
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isAdminSistema,
    isAdminUsuarios,
    isAdminVeterinaria,
    isVeterinario,
    isGerente,
    isRecepcionista,
    isAsistente,
    isConsultorDatos,
    hasPermission,
    login,
    logout
  };
});
