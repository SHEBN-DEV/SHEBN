# SHEBN - Plataforma Exclusiva para Mujeres

SHEBN es una plataforma diseñada exclusivamente para mujeres que integra verificación de identidad (KYC) a través de Didit para garantizar la seguridad y autenticidad de la comunidad.

> **🌐 Sitio Web**: [https://shebn.vercel.app/](https://shebn.vercel.app/)
> 
> **💡 Plan Gratuito**: Esta implementación utiliza el plan gratuito de Didit con enlaces de verificación directos y Supabase gratuito.

## 🚀 Características Principales

### 🔐 Autenticación y Registro
- **Registro exclusivo para mujeres**: Solo se permiten registros de género femenino
- **Validación de identidad**: Integración con Didit KYC para verificación de identidad
- **Almacenamiento seguro**: Datos almacenados en Supabase con encriptación
- **Estados de verificación**: Sistema completo de seguimiento del estado de verificación

### 👥 Gestión de Usuarios
- **Perfiles personalizados**: Información completa del usuario
- **Estados de verificación**: Pending, Completed, Rejected, Expired, Error
- **Validación de género**: Verificación automática en múltiples niveles
- **Historial de verificaciones**: Seguimiento completo de intentos de verificación

### 🎨 Interfaz de Usuario
- **Diseño responsive**: Optimizado para todos los dispositivos
- **Tailwind CSS**: Estilos modernos y consistentes
- **UX intuitiva**: Flujo de registro y verificación simplificado
- **Feedback visual**: Estados claros y mensajes informativos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **KYC**: Didit API
- **Formularios**: React Hook Form
- **Iconos**: React Icons

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de Didit (para KYC)

## 🔧 Configuración del Proyecto

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd SHEBN
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

#### Opción 1: Configuración automática
```bash
npm run setup
```

#### Opción 2: Configuración manual
Crear un archivo `.env.local` en la raíz del proyecto:

```bash
cp env.example .env.local
```

Luego editar el archivo `.env.local` con tus valores:

```env
# ========================================
# SUPABASE CONFIGURATION
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ========================================
# DIDIT KYC CONFIGURATION (PLAN GRATUITO)
# ========================================
# Para el plan gratuito de Didit, estas variables son opcionales
DIDIT_API_KEY=free_plan
DIDIT_API_BASE_URL=https://verification.didit.me
DIDIT_WORKFLOW_ID=free_plan
DIDIT_WEBHOOK_SECRET=free_plan_secret

# ========================================
# NEXT.JS CONFIGURATION
# ========================================
NEXT_PUBLIC_BASE_URL=https://shebn.vercel.app
NODE_ENV=production
```

### 4. Verificar configuración
```bash
npm run check-env
```

### 4. Configurar la base de datos
Ejecutar el script SQL en tu base de datos de Supabase:

```bash
# Copiar el contenido de database-schema.sql y ejecutarlo en Supabase SQL Editor
```

### 5. Ejecutar el proyecto
```bash
npm run dev
```

### 6. Verificar que todo funcione
```bash
npm run check-env
```

## 🔄 Flujo de Registro y Verificación

### 1. Registro de Usuario
1. El usuario accede a `/signup`
2. Completa el formulario con información personal
3. **Selecciona género** (solo se permite "Femenino")
4. Sistema valida que el género sea femenino
5. Se crea la cuenta en Supabase Auth
6. Se crea el perfil en la tabla `profiles`
7. Se genera la verificación de Didit (plan gratuito)

### 2. Verificación de Identidad (Plan Gratuito)
**Opción A: Verificación con Didit**
1. Usuario recibe enlace directo a `https://verification.didit.me/v2/sesión/`
2. Completa el proceso de verificación en Didit
3. Sistema actualiza estado automáticamente

**Opción B: Verificación Manual**
1. Usuario hace clic en "VERIFICACIÓN MANUAL"
2. Sistema marca la verificación como completada
3. Usuario puede acceder a la plataforma inmediatamente



### 3. Estados de Verificación
- **pending**: Verificación en proceso
- **completed**: Verificación exitosa
- **rejected**: Verificación rechazada
- **expired**: Verificación expirada
- **error**: Error en el proceso
- **rejected_gender**: Rechazado por género no permitido

## 📁 Estructura del Proyecto

```
SHEBN/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── signup/          # API de registro
│   │   │   └── didit/
│   │   │       └── verification/    # APIs de Didit
│   │   ├── auth/
│   │   │   ├── login/               # Página de login
│   │   │   ├── register/            # Página de registro
│   │   │   └── verification/        # Páginas de verificación
│   │   └── lib/
│   │       └── didit/               # Cliente de Didit
│   ├── components/
│   │   ├── GenderSelect.jsx         # Selector de género
│   │   ├── InputField.jsx           # Campo de entrada
│   │   ├── PasswordField.jsx        # Campo de contraseña
│   │   └── Navbar.jsx               # Navegación
│   └── SupabaseClient.js            # Cliente de Supabase
├── database-schema.sql              # Esquema de base de datos
└── README.md                        # Documentación
```

## 🔒 Seguridad

### Validaciones Implementadas
- **Validación de género**: Solo mujeres pueden registrarse
- **Validación en base de datos**: Triggers SQL para validación adicional
- **Verificación de identidad**: KYC obligatorio para completar registro
- **Row Level Security**: Políticas de acceso en Supabase
- **Validación de webhooks**: Firma de Didit para callbacks

### Políticas de Privacidad
- Datos personales protegidos por RLS
- Información de verificación encriptada
- Acceso limitado a datos sensibles
- Cumplimiento con regulaciones de privacidad

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Otros proveedores
- Netlify
- Railway
- Heroku

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación de Didit y Supabase

## 🔄 Actualizaciones

### v1.0.0 - Lanzamiento inicial
- Sistema de registro exclusivo para mujeres
- Integración completa con Didit KYC
- Validación de género en múltiples niveles
- Interfaz moderna con Tailwind CSS
- Base de datos optimizada con RLS
