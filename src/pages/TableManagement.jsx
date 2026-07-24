import { useState } from 'react';
import TableGrid from '../components/table-management/TableGrid';
import TableDetailPanel from '../components/table-management/TableDetailPanel';
import './TableManagement.css';

function TableManagement() {
  const [selectedTable, setSelectedTable] = useState(null);

  return (
    <div className="table-management" id="table-management-page">
      <div
        className={`table-management__main ${
          selectedTable ? 'table-management__main--with-panel' : ''
        }`}
      >
        <TableGrid
          onSelectTable={(table) => setSelectedTable(table)}
          selectedTableId={selectedTable?.id}
        />
      </div>

      {selectedTable && (
        <TableDetailPanel
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  );
}

export default TableManagement;
