
import { supabase } from '../supabase';
import type { Tenant } from '../../domain/types';

export const tenantRepository = {
    async getCurrent() {
        console.log('[TenantRepository] Buscando tenant atual...');
        
        // Get the current user's tenant_id from the profile
        const user = (await supabase.auth.getUser()).data.user;
        console.log('[TenantRepository] Usuário atual:', user?.id);
        
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[TenantRepository] Erro ao buscar profile:', profileError);
            throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
        }
        
        if (!profile?.tenant_id) {
            console.error('[TenantRepository] Usuário sem tenant_id');
            throw new Error('Usuário não possui uma empresa vinculada');
        }

        console.log('[TenantRepository] Tenant ID do usuário:', profile.tenant_id);

        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single();

        if (error) {
            console.error('[TenantRepository] Erro ao buscar tenant:', error);
            throw new Error(`Erro ao carregar empresa: ${error.message}`);
        }

        console.log('[TenantRepository] Tenant encontrado:', data?.name);
        return data as Tenant;
    },

    async update(id: string, tenant: Partial<Tenant>) {
        console.log(`[TenantRepository] Atualizando tenant ${id}...`);
        
        const { data, error } = await supabase
            .from('tenants')
            .update(tenant)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[TenantRepository] Erro ao atualizar tenant ${id}:`, error);
            throw new Error(`Erro ao atualizar empresa: ${error.message}`);
        }

        console.log('[TenantRepository] Tenant atualizado:', data?.id);
        return data as Tenant;
    },

    async uploadLogo(file: File) {
        console.log('[TenantRepository] Fazendo upload de logo...');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { data, error } = await supabase.storage
            .from('photos')
            .upload(filePath, file);

        if (error) {
            console.error('[TenantRepository] Erro no upload:', error);
            throw new Error(`Erro no upload: ${error.message}`);
        }

        console.log('[TenantRepository] Upload completo:', data?.path);
        return data.path;
    }
};
