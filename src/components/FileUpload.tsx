import { useRef, useState, type DragEvent } from 'react';
import JSZip from 'jszip';
import type { UploadResult } from '../types';
import { parseNFeXml } from '../utils/parser';
import { gerarId } from '../utils/consolidacao';

interface FileUploadProps {
  onResults: (results: UploadResult[]) => void;
}

export function FileUpload({ onResults }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const processXmlText = (text: string, fileName: string, source: 'file' | 'zip', zipName?: string): UploadResult => {
    const result = parseNFeXml(text, fileName);
    return {
      id: gerarId(),
      fileName,
      source,
      zipName,
      result,
      selected: true,
    };
  };

  const handleZip = async (file: File): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const xmlFiles = Object.values(zip.files).filter(
        (f) => !f.dir && f.name.toLowerCase().endsWith('.xml'),
      );
      for (const xmlFile of xmlFiles) {
        const text = await xmlFile.async('text');
        const name = xmlFile.name.split('/').pop() || xmlFile.name;
        results.push(processXmlText(text, name, 'zip', file.name));
      }
    } catch (err) {
      results.push({
        id: gerarId(),
        fileName: file.name,
        source: 'file',
        result: {
          success: false,
          error: `Erro ao descompactar: ${err instanceof Error ? err.message : String(err)}`,
          fileName: file.name,
        },
        selected: true,
      });
    }
    return results;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);

    const allResults: UploadResult[] = [];
    for (const file of Array.from(files)) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.zip')) {
        const zipResults = await handleZip(file);
        allResults.push(...zipResults);
      } else if (lower.endsWith('.xml')) {
        const text = await file.text();
        allResults.push(processXmlText(text, file.name, 'file'));
      }
    }

    onResults(allResults);
    setLoading(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    await handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xml,.zip"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />
      <div className="upload-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <h3>{loading ? 'Analisando...' : 'Arraste arquivos XML ou ZIP da NFe aqui'}</h3>
      <p>ou clique para selecionar arquivos</p>
      <div className="upload-formats">
        <span className="upload-hint">XML</span>
        <span className="upload-hint">ZIP (múltiplos XMLs)</span>
      </div>
    </div>
  );
}
