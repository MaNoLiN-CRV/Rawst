import { useState } from 'react'
import DatabaseConnection from './components/DatabaseConnection'
import EntitySelector from './components/EntitySelector'
import EntityConfig, { EntityFieldConfig } from './components/EntityConfig'
import JsonPreview from './components/JsonPreview'
import { invoke } from '@tauri-apps/api/core'

interface TableInfo {
  name: string
}

function App() {
  const [step, setStep] = useState(0)
  const [dbConfig, setDbConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [tables, setTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [tableFields, setTableFields] = useState<{ [table: string]: string[] }>({})
  const [entityConfig, setEntityConfig] = useState<{ [table: string]: EntityFieldConfig }>({})

  // Step 1: Connect to the database and get tables
  const handleConnect = async (config: any) => {
    setLoading(true)
    setError(undefined)
    try {
      const result: TableInfo[] = await invoke('get_mariadb_tables', config)
      setTables(result.map(t => t.name))
      setDbConfig(config)
      setStep(1)
    } catch (e: any) {
      setError(e?.toString() || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Get fields for each selected table
  const handleSelectTables = async (selected: string[]) => {
    setSelectedTables(selected)
    // Get fields for each selected table
    if (selected.length > 0) {
      setLoading(true)
      setError(undefined)
      try {
        // Consulta los campos de cada tabla usando MariaDB
        const fieldsResult: { [table: string]: string[] } = {}
        for (const table of selected) {
          const columns: string[] = await invoke('get_mariadb_table_columns', { ...dbConfig, table })
          fieldsResult[table] = columns
        }
        setTableFields(fieldsResult)
        // Inicializa la configuración de entidades
        const initialConfig: { [table: string]: EntityFieldConfig } = {}
        for (const table of selected) {
          initialConfig[table] = { fields: fieldsResult[table], endpoints: ['GET', 'POST', 'PUT', 'DELETE'] }
        }
        setEntityConfig(initialConfig)
        setStep(2)
      } catch (e: any) {
        setError(e?.toString() || 'Error obteniendo campos')
      } finally {
        setLoading(false)
      }
    }
  }

  // Step 3: Entity configuration
  const handleConfigChange = (config: { [table: string]: EntityFieldConfig }) => {
    setEntityConfig(config)
  }

  // Step 4: Generate final JSON
  const configJson = {
    database: dbConfig,
    entities: Object.entries(entityConfig).map(([table, cfg]) => ({
      table,
      fields: cfg.fields,
      endpoints: cfg.endpoints,
    })),
  }

  return (
    <div>
      {step === 0 && (
        <DatabaseConnection onConnect={handleConnect} loading={loading} error={error} />
      )}
      {step === 1 && (
        <EntitySelector tables={tables} selected={selectedTables} onChange={handleSelectTables} />
      )}
      {step === 2 && (
        <EntityConfig entities={tableFields} config={entityConfig} onChange={handleConfigChange} />
      )}
      {step === 2 && (
        <JsonPreview json={configJson} />
      )}
    </div>
  )
}

export default App
