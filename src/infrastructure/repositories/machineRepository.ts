
import { supabase } from '../supabase';
import type { Machine, EnergySource, NR12Annex } from '../../domain/types';

export const machineRepository = {
    async getAll() {
        const { data, error } = await supabase
            .from('machines')
            .select(`
                *,
                client:clients(name),
                machine_energy_sources(energy_source),
                machine_applicable_annexes(annex)
            `)
            .order('name');

        if (error) throw error;
        
        // Transformar dados de relacionamento
        return (data || []).map((m: any) => ({
            ...m,
            energy_sources: m.machine_energy_sources?.map((es: any) => es.energy_source) || [],
            applicable_annexes: m.machine_applicable_annexes?.map((ma: any) => ma.annex) || [],
        })) as (Machine & { client?: { name: string } })[];
    },

    async getByClientId(clientId: string) {
        const { data, error } = await supabase
            .from('machines')
            .select(`
                *,
                machine_energy_sources(energy_source),
                machine_applicable_annexes(annex)
            `)
            .eq('client_id', clientId)
            .order('name');

        if (error) throw error;
        
        return (data || []).map((m: any) => ({
            ...m,
            energy_sources: m.machine_energy_sources?.map((es: any) => es.energy_source) || [],
            applicable_annexes: m.machine_applicable_annexes?.map((ma: any) => ma.annex) || [],
        })) as Machine[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('machines')
            .select(`
                *,
                client:clients(name),
                machine_energy_sources(energy_source),
                machine_applicable_annexes(annex)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        
        return {
            ...data,
            energy_sources: data.machine_energy_sources?.map((es: any) => es.energy_source) || [],
            applicable_annexes: data.machine_applicable_annexes?.map((ma: any) => ma.annex) || [],
        } as Machine;
    },

    async create(machine: Omit<Machine, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) {
        const { energy_sources, applicable_annexes, ...machineData } = machine as any;
        
        // Inserir máquina
        const { data, error } = await supabase
            .from('machines')
            .insert(machineData)
            .select()
            .single();

        if (error) throw error;

        // Inserir fontes de energia
        if (energy_sources && energy_sources.length > 0) {
            const energyInserts = energy_sources.map((source: EnergySource) => ({
                machine_id: data.id,
                energy_source: source,
            }));
            
            const { error: energyError } = await supabase
                .from('machine_energy_sources')
                .insert(energyInserts);
            
            if (energyError) {
                console.error('Erro ao inserir fontes de energia:', energyError);
            }
        }

        // Inserir anexos aplicáveis
        if (applicable_annexes && applicable_annexes.length > 0) {
            const annexInserts = applicable_annexes.map((annex: NR12Annex) => ({
                machine_id: data.id,
                annex: annex,
            }));
            
            const { error: annexError } = await supabase
                .from('machine_applicable_annexes')
                .insert(annexInserts);
            
            if (annexError) {
                console.error('Erro ao inserir anexos:', annexError);
            }
        }

        return { ...data, energy_sources: energy_sources || [], applicable_annexes: applicable_annexes || [] } as Machine;
    },

    async update(id: string, machine: Partial<Machine>) {
        const { energy_sources, applicable_annexes, ...machineData } = machine as any;
        
        // Atualizar dados da máquina
        const { data, error } = await supabase
            .from('machines')
            .update(machineData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Atualizar fontes de energia se fornecidas
        if (energy_sources !== undefined) {
            // Remover existentes
            await supabase
                .from('machine_energy_sources')
                .delete()
                .eq('machine_id', id);

            // Inserir novas
            if (energy_sources.length > 0) {
                const energyInserts = energy_sources.map((source: EnergySource) => ({
                    machine_id: id,
                    energy_source: source,
                }));
                
                const { error: energyError } = await supabase
                    .from('machine_energy_sources')
                    .insert(energyInserts);
                
                if (energyError) {
                    console.error('Erro ao atualizar fontes de energia:', energyError);
                }
            }
        }

        // Atualizar anexos se fornecidos
        if (applicable_annexes !== undefined) {
            // Remover existentes
            await supabase
                .from('machine_applicable_annexes')
                .delete()
                .eq('machine_id', id);

            // Inserir novos
            if (applicable_annexes.length > 0) {
                const annexInserts = applicable_annexes.map((annex: NR12Annex) => ({
                    machine_id: id,
                    annex: annex,
                }));
                
                const { error: annexError } = await supabase
                    .from('machine_applicable_annexes')
                    .insert(annexInserts);
                
                if (annexError) {
                    console.error('Erro ao atualizar anexos:', annexError);
                }
            }
        }

        return { ...data, energy_sources: energy_sources || [], applicable_annexes: applicable_annexes || [] } as Machine;
    },

    async delete(id: string) {
        // As deleções em cascata nas tabelas de relacionamento
        // devem ser tratadas pelo ON DELETE CASCADE no banco
        const { error } = await supabase
            .from('machines')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Métodos adicionais para filtros e buscas
    async getByCriticality(criticality: string) {
        const { data, error } = await supabase
            .from('machines')
            .select(`
                *,
                client:clients(name),
                machine_energy_sources(energy_source),
                machine_applicable_annexes(annex)
            `)
            .eq('criticality', criticality)
            .order('name');

        if (error) throw error;
        
        return (data || []).map((m: any) => ({
            ...m,
            energy_sources: m.machine_energy_sources?.map((es: any) => es.energy_source) || [],
            applicable_annexes: m.machine_applicable_annexes?.map((ma: any) => ma.annex) || [],
        })) as (Machine & { client?: { name: string } })[];
    },

    async getByPlantSector(sector: string) {
        const { data, error } = await supabase
            .from('machines')
            .select(`
                *,
                client:clients(name),
                machine_energy_sources(energy_source),
                machine_applicable_annexes(annex)
            `)
            .eq('plant_sector', sector)
            .order('name');

        if (error) throw error;
        
        return (data || []).map((m: any) => ({
            ...m,
            energy_sources: m.machine_energy_sources?.map((es: any) => es.energy_source) || [],
            applicable_annexes: m.machine_applicable_annexes?.map((ma: any) => ma.annex) || [],
        })) as (Machine & { client?: { name: string } })[];
    },

    async searchByTagOrName(query: string) {
        const { data, error } = await supabase
            .from('machines')
            .select(`
                *,
                client:clients(name),
                machine_energy_sources(energy_source),
                machine_applicable_annexes(annex)
            `)
            .or(`tag.ilike.%${query}%,name.ilike.%${query}%`)
            .order('name');

        if (error) throw error;
        
        return (data || []).map((m: any) => ({
            ...m,
            energy_sources: m.machine_energy_sources?.map((es: any) => es.energy_source) || [],
            applicable_annexes: m.machine_applicable_annexes?.map((ma: any) => ma.annex) || [],
        })) as (Machine & { client?: { name: string } })[];
    }
};
