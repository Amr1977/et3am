import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DebugLogProps {
  logs: string[];
  maxLogs?: number;
  onClear?: () => void;
}

export default function DebugLog({ logs, maxLogs = 20, onClear }: DebugLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
  };

  return createPortal(
    <div
      className="debug-log-container"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        color: '#0f0',
        fontSize: '11px',
        fontFamily: 'monospace',
        padding: '8px',
        paddingBottom: '36px',
        maxHeight: '120px',
        overflowY: 'auto',
        zIndex: 2147483647, // Maximum possible z-index
        borderTop: '2px solid #333',
        pointerEvents: 'auto',
      }}
      ref={containerRef}
    >
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        right: 0, 
        display: 'flex', 
        justifyContent: 'flex-end',
        gap: '4px',
        zIndex: 100000 
      }}>
        {logs.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            style={{
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            COPY
          </button>
        )}
        {logs.length > 0 && onClear && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{
              background: '#cc3300',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            CLEAR
          </button>
        )}
      </div>
      <div style={{ marginBottom: '4px', fontWeight: 'bold', color: '#ff0' }}>
        DEBUG LOGS: {logs.length === 0 && <span style={{ color: '#888', fontWeight: 'normal' }}>(no events detected yet - try clicking map)</span>}
      </div>
      {logs.slice(-maxLogs).map((log, i) => (
        <div key={i} style={{ marginBottom: '2px', borderBottom: '1px solid #222' }}>
          {log}
        </div>
      ))}
    </div>,
    document.body
  );
}

export function useDebugLog() {
  const logsRef = React.useRef<string[]>([]);
  const [, forceUpdate] = React.useState(0);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    const log = `[${time}] ${msg}`;
    console.log(log);
    logsRef.current = [...logsRef.current.slice(-20), log];
    forceUpdate(n => n + 1);
  };

  const clearLogs = () => {
    logsRef.current = [];
    forceUpdate(n => n + 1);
  };

  return { logs: logsRef.current, addLog, clearLogs };
}