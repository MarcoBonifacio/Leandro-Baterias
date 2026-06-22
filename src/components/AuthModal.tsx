const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      let processedEmail = email.trim();
      let processedPassword = password;
      
      // Verificación estricta del bypass de administrador local
      const isInputAdmin = (processedEmail.toLowerCase() === 'admin' || processedEmail.toLowerCase() === 'admin@leandrobaterias.com') && 
                          (processedPassword === 'admin' || processedPassword === 'admin123');

      if (processedEmail.toLowerCase() === 'admin') {
        processedEmail = 'admin@leandrobaterias.com';
      }
      if (processedPassword === 'admin') {
        processedPassword = 'admin123';
      }

      if (isLoginView) {
        // --- BYPASS DE ADMINISTRADOR SEGURO ---
        if (isInputAdmin) {
          localStorage.setItem('admin_session', 'true');
          const adminProfile: UserProfile = {
            id: 'admin-bypass-id',
            name: 'Administrador (Admin)',
            email: 'admin@leandrobaterias.com',
            phone: '999999999',
            role: 'admin'
          };
          setSuccessMsg('¡Bienvenido de vuelta, Administrador!');
          setTimeout(() => {
            onSuccess(adminProfile);
            onClose();
            handleReset();
          }, 1200);
          return;
        }

        // --- BYPASS DE LOGIN PARA USUARIOS DE PRUEBA ---
        if (processedEmail.endsWith('@test.com')) {
          const fakeProfile: UserProfile = {
            id: 'fake-user-' + Math.random().toString(36).substring(2, 11),
            name: 'Usuario de Prueba',
            email: processedEmail,
            phone: '999888777',
            role: 'user'
          };
          setSuccessMsg(`¡Bienvenido (Modo de Prueba), ${fakeProfile.name}!`);
          setTimeout(() => {
            onSuccess(fakeProfile);
            onClose();
            handleReset();
          }, 1200);
          return;
        }

        // --- 1. LÓGICA DE INICIO DE SESIÓN PARA USUARIOS REALES ---
        if (!processedEmail || !processedPassword) {
          throw new Error('Por favor completa todos los campos.');
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: processedEmail,
          password: processedPassword,
        });

        if (authError) throw authError;
        if (!authData || !authData.user) throw new Error('No se pudo autenticar el usuario.');

        let profile = await getUserProfile(authData.user.id);
        if (!profile) {
          profile = {
            id: authData.user.id,
            name: authData.user.user_metadata?.name || 'Cliente registrado',
            email: authData.user.email || processedEmail,
            phone: authData.user.user_metadata?.phone || '',
            role: 'user'
          };
          try {
            await createUserProfile(profile.id, profile.name, profile.email, profile.phone, profile.role);
          } catch (err) {
            console.warn('Advertencia silenciosa: No se pudo auto-crear el perfil en la tabla DB:', err);
          }
        }

        setSuccessMsg(`¡Bienvenido de vuelta, ${profile.name}!`);
        setTimeout(() => {
          onSuccess(profile!);
          onClose();
          handleReset();
        }, 1200);

      } else {
        // --- 2. LÓGICA DE REGISTRO DE NUEVAS CUENTAS ---
        if (!processedEmail || !processedPassword || !name || !phone) {
          throw new Error('Por favor completa Nombre, Correo, Teléfono y Contraseña.');
        }

        if (processedPassword.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        // --- BYPASS DE REGISTRO PARA EVITAR EMAIL RATE LIMIT ---
        if (processedEmail.endsWith('@test.com')) {
          const fakeProfile: UserProfile = {
            id: 'fake-user-' + Math.random().toString(36).substring(2, 11),
            name: name,
            email: processedEmail,
            phone: phone,
            role: 'user'
          };
          
          setSuccessMsg('¡Usuario registrado con éxito (Entorno Local)!');
          setTimeout(() => {
            onSuccess(fakeProfile);
            onClose();
            handleReset();
          }, 1500);
          return;
        }

        // Registro real en Supabase para usuarios de producción
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: processedEmail,
          password: processedPassword,
          options: {
            data: { name, phone, role: 'user' }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No se pudo registrar en los servidores de autenticación.');

        await createUserProfile(authData.user.id, name, processedEmail, phone, 'user');

        setSuccessMsg('¡Usuario registrado con éxito!');
        setTimeout(() => {
          onSuccess({
            id: authData.user!.id,
            name,
            email: processedEmail,
            phone,
            role: 'user'
          });
          onClose();
          handleReset();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Excepción en Auth Handler:', error);
      setErrorMsg(error.message || 'Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };
