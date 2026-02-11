
import { supabase } from '../supabase';
import type { Client } from '../../domain/types';

export const clientRepository = {
    async getAll() {
        console.log('[ClientRepository] Buscando todos os clientes...');
        
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name');

        if (error) {
            console.error('[ClientRepository] Erro ao buscar clientes:', error);
            throw new Error(`Erro ao carregar clientes: ${error.message}`);
        }

        console.log(`[ClientRepository] ${data?.length || 0} clientes encontrados`);
        return data as Client[];
    },

    async getById(id: string) {
        console.log(`[ClientRepository] Buscando cliente ${id}...`);
        
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`[ClientRepository] Erro ao buscar cliente ${id}:`, error);
            throw new Error(`Erro ao carregar cliente: ${error.message}`);
        }

        console.log('[ClientRepository] Cliente encontrado:', data?.name);
        return data as Client;
    },

    async create(client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) {
        console.log('[ClientRepository] Criando cliente:', client.name);
        
        const { data, error } = await supabase
            .from('clients')
            .insert(client)
            .select()
            .single();

        if (error) {
            console.error('[ClientRepository] Erro ao criar cliente:', error);
            throw new Error(`Erro ao criar cliente: ${error.message}`);
        }

        console.log('[ClientRepository] Cliente criado:', data?.id);
        return data as Client;
    },

    async update(id: string, client: Partial<Client>) {
        console.log(`[ClientRepository] Atualizando cliente ${id}...`);
        
        const { data, error } = await supabase
            .from('clients')
            .update(client)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[ClientRepository] Erro ao atualizar cliente ${id}:`, error);
            throw new Error(`Erro ao atualizar cliente: ${error.message}`);
        }

        console.log('[ClientRepository] Cliente atualizado:', data?.id);
        return data as Client;
    },

    async delete(id: string) {
        console.log(`[ClientRepository] Deletando cliente ${id}...`);
        
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`[ClientRepository] Erro ao deletar cliente ${id}:`, error);
            throw new Error(`Erro ao deletar cliente: ${error.message}`);
        }

        console.log('[ClientRepository] Cliente deletado:', id);
    }
};
