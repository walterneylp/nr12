
export type UUID = string;

// -- Enums --

export type MachineType =
    | 'CONFORMACAO'
    | 'ROTATIVA'
    | 'CORTE'
    | 'ELEVACAO'
    | 'COZINHA'
    | 'EMBALAGEM'
    | 'INJECAO'
    | 'USINAGEM'
    | 'PRENSA'
    | 'TRANSPORTADOR'
    | 'OUTROS';

export type MachineCriticality =
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
    | 'CRITICAL';

export type ReportStatus =
    | 'DRAFT'
    | 'IN_REVIEW'
    | 'READY'
    | 'SIGNED'
    | 'ARCHIVED';

export type JobStatus =
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

export type ChecklistStatus =
    | 'COMPLIANT'
    | 'NONCOMPLIANT'
    | 'NOT_APPLICABLE';

export type ActionPriority =
    | 'CRITICAL'
    | 'HIGH'
    | 'MEDIUM'
    | 'LOW'
    | 'IMPROVEMENT';

export type RiskLevel =
    | 'ACEITAVEL'
    | 'TOLERAVEL'
    | 'INACEITAVEL'
    | 'CRITICO';

export type ActionDiscipline =
    | 'MECHANICAL'
    | 'ELECTRICAL'
    | 'AUTOMATION'
    | 'HYDRAULIC'
    | 'PNEUMATIC'
    | 'OPERATIONAL'
    | 'OTHER';

export type EnergySource =
    | 'ELETRICA'
    | 'PNEUMATICA'
    | 'HIDRAULICA'
    | 'COMBUSTIVEL'
    | 'MANUAL'
    | 'VAPOR';

export type NR12Annex =
    | 'I'
    | 'II'
    | 'III'
    | 'IV'
    | 'V'
    | 'VI'
    | 'VII'
    | 'VIII'
    | 'IX'
    | 'X';

// -- Entities --

export interface Tenant {
    id: UUID;
    name: string;
    slug: string;
    trade_name?: string;
    cnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone?: string;
    email?: string;
    technical_manager?: string;
    crea_number?: string;
    logo_file_id?: UUID;
    created_at?: string;
}

export interface Client {
    id: UUID;
    tenant_id: UUID;
    name: string;
    trade_name?: string;
    cnpj?: string;
    address?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone?: string;
    email?: string;
    contact_name?: string;
    technical_manager?: string;
    created_at?: string;
}

export interface Machine {
    id: UUID;
    tenant_id: UUID;
    client_id: UUID;
    site_id?: UUID;
    
    // Identificação
    tag: string;
    name: string;
    description?: string;
    
    // Fabricante
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    year?: number;
    
    // Classificação
    machine_type: MachineType;
    criticality?: MachineCriticality;
    
    // Especificações Técnicas
    power?: string;                    // Potência (kW/HP)
    energy_sources?: EnergySource[];   // Fontes de energia
    productivity_capacity?: string;    // Capacidade produtiva
    voltage?: string;                  // Tensão (V)
    frequency?: string;                // Frequência (Hz)
    
    // Limites e Aplicação
    limits?: string;                   // Limites da máquina
    applicable_annexes?: NR12Annex[];  // Anexos NR-12 aplicáveis
    
    // Localização
    location?: string;
    plant_sector?: string;             // Setor/Planta
    production_line?: string;          // Linha de produção
    
    // Documentação
    photo_file_id?: UUID;
    qr_code_uuid?: string;
    manual_file_id?: UUID;             // Manual do fabricante
    electrical_diagram_id?: UUID;      // Diagrama elétrico
    
    // Risco
    risk_level?: RiskLevel;            // Derivado do último laudo
    
    // Metadados
    created_at?: string;
    updated_at?: string;
}

export interface Job {
    id: UUID;
    tenant_id: UUID;
    client_id: UUID;
    code?: string;
    title: string;
    description?: string;
    status: JobStatus;
    start_date?: string;
    end_date?: string;
    due_date?: string;
    assigned_to?: UUID;
    estimated_value?: number;
    created_at?: string;
    updated_at?: string;
    created_by?: UUID;
    deleted_at?: string;
    // Joins
    client?: { id: UUID; name: string };
    assigned_user?: { id: UUID; name: string; email: string };
}

export interface Report {
    id: UUID;
    tenant_id: UUID;
    client_id: UUID;
    job_id?: UUID;  // Torna opcional inicialmente
    title: string;
    status: ReportStatus;
    checklist_version_id: UUID;
    validity_months: number;
    valid_from?: string;
    valid_until?: string;
    art_number?: string;
    art_file_id?: string;  // Path no storage, não UUID
    draft_pdf_file_id?: string;  // Path no storage, não UUID
    signed_pdf_file_id?: string;  // Path no storage, não UUID
    signature_mode: 'EXTERNAL_UPLOAD' | 'SIMPLE_E_SIGN' | 'INTEGRATED_PROVIDER';
    signed_at?: string;
    signed_by?: UUID;
    signed_hash_sha256?: string;
    revision: number;
    parent_report_id?: UUID;
    locked_at?: string;
    created_at?: string;
}

export interface ChecklistResponse {
    id: UUID;
    tenant_id: UUID;
    report_id: UUID;
    machine_id: UUID;
    requirement_id: UUID;
    status: ChecklistStatus;
    observation?: string;
    evidence_file_ids?: UUID[];        // Múltiplas evidências fotográficas
    created_at?: string;
    updated_at?: string;
}

export interface RiskAssessment {
    id: UUID;
    tenant_id: UUID;
    report_id: UUID;
    machine_id: UUID;
    created_at?: string;
}

export interface RiskEntry {
    id: UUID;
    assessment_id: UUID;
    tenant_id: UUID;
    hazard: string;
    hazard_location?: string;
    possible_consequence?: string;
    hrn_severity: number;
    hrn_probability: number;
    hrn_frequency: number;
    hrn_number: number;
    risk_level: RiskLevel;
    required_category?: string;        // Categoria de segurança requerida
    safety_category?: string;          // Categoria implementada/proposta
    performance_level?: string;        // PL requerido (ISO 13849)
    required_pl?: string;              // PL calculado
    residual_risk?: string;
    notes?: string;
    photos?: string[];
    created_at?: string;
}

export interface ActionItem {
    id: UUID;
    plan_id: UUID;
    tenant_id: UUID;
    priority: ActionPriority;
    discipline: ActionDiscipline;
    description: string;
    due_days: number;
    due_date?: string;
    responsible_name?: string;         // Nome do responsável
    responsible_id?: UUID;
    status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED';
    evidence_before_id?: UUID;
    evidence_after_id?: UUID;
    closed_at?: string;
    created_at?: string;
}

export interface ActionPlan {
    id: UUID;
    tenant_id: UUID;
    report_id: UUID;
    machine_id: UUID;
    items?: ActionItem[];
    created_at?: string;
}

export interface Requirement {
    id: UUID;
    checklist_version_id: UUID;
    item: string;
    description: string;
    group_name?: string;
    standard_reference?: string;
    risk_category?: string;
    is_required?: boolean;
    sort_order: number;
}

export interface ValidationRecord {
    id: UUID;
    tenant_id: UUID;
    report_id: UUID;
    test_type: 'EMERGENCY_STOP' | 'INTERLOCK' | 'LIGHT_CURTAIN' | 'BIMANUAL' | 'SCANNER' | 'OTHERS';
    test_description: string;
    expected_result: string;
    actual_result: string;
    passed: boolean;
    tested_by?: string;
    tested_at?: string;
    evidence_file_id?: UUID;
    notes?: string;
    created_at?: string;
}

export interface TrainingRecord {
    id: UUID;
    tenant_id: UUID;
    machine_id: UUID;
    trainee_name: string;
    trainee_role?: string;
    training_type: 'INITIAL' | 'RECYCLING';
    content_summary?: string;
    duration_hours?: number;
    instructor_name?: string;
    certificate_number?: string;
    valid_until?: string;
    created_at?: string;
}
