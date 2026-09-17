import { useState, useEffect } from 'react';
import { X, Clock, User, AlertCircle, Edit2, Lock, Unlock, PlusCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ScoreHistoryModalProps {
  scoreId: number;
  onClose: () => void;
}

export default function ScoreHistoryModal({ scoreId, onClose }: ScoreHistoryModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('score_audit_logs')
          .select(`
            *,
            actor:profiles(full_name, role)
          `)
          .eq('score_id', scoreId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [scoreId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Clock className="text-primary" size={20} />
            Riwayat Perubahan Nilai
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Memuat riwayat...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
              <AlertCircle size={32} className="text-gray-300 mb-3" />
              <p>Belum ada riwayat tercatat untuk nilai ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, idx) => {
                const isScoresTable = log.table_name === 'scores';
                let actionDesc = '';
                let Icon = Edit2;
                let colorClass = 'text-blue-600 bg-blue-100';

                if (log.action === 'INSERT') {
                  actionDesc = isScoresTable ? 'Nilai pertama kali dimasukkan' : 'Detail kriteria diinput';
                  Icon = PlusCircle;
                  colorClass = 'text-emerald-600 bg-emerald-100';
                } else if (log.action === 'UPDATE') {
                  if (isScoresTable && log.new_data?.locked !== log.old_data?.locked) {
                    if (log.new_data?.locked) {
                      actionDesc = 'Nilai dikunci oleh Admin';
                      Icon = Lock;
                      colorClass = 'text-red-600 bg-red-100';
                    } else {
                      actionDesc = 'Kunci nilai dibuka';
                      Icon = Unlock;
                      colorClass = 'text-yellow-600 bg-yellow-100';
                    }
                  } else {
                    actionDesc = isScoresTable ? 'Kalkulasi ulang total nilai (Otomatis)' : 'Jumlah kesalahan (mistakes) diubah';
                  }
                } else if (log.action === 'DELETE') {
                  actionDesc = 'Data dihapus';
                  Icon = Trash2;
                  colorClass = 'text-red-600 bg-red-100';
                }

                return (
                  <div key={log.id} className="flex gap-4 relative">
                    {/* Timeline vertical line */}
                    {idx !== logs.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-[-16px] w-0.5 bg-gray-100"></div>
                    )}
                    
                    <div className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                    </div>
                    
                    <div className="pb-6 pt-1 flex-1">
                      <p className="font-semibold text-gray-900">{actionDesc}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                        <User size={12} />
                        <span className="font-medium text-gray-700">{log.actor?.full_name || 'Sistem'}</span>
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">{log.actor?.role || 'System'}</span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      
                      {/* Show score changes */}
                      {isScoresTable && log.action === 'UPDATE' && log.old_data?.total_score !== log.new_data?.total_score && (
                        <div className="mt-3 bg-gray-50/80 p-3 rounded-lg text-sm border border-gray-100 inline-block min-w-[200px]">
                          <div className="text-gray-500 text-xs mb-1">Perubahan Nilai:</div>
                          <div className="flex items-center gap-3">
                            <span className="line-through text-red-400 font-medium">{log.old_data.total_score}</span>
                            <span className="text-gray-300">→</span>
                            <span className="font-bold text-emerald-600">{log.new_data.total_score}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Show mistakes changes */}
                      {!isScoresTable && log.action === 'UPDATE' && log.old_data?.mistakes !== log.new_data?.mistakes && (
                         <div className="mt-3 bg-gray-50/80 p-3 rounded-lg text-sm border border-gray-100 inline-block min-w-[200px]">
                          <div className="text-gray-500 text-xs mb-1">Perubahan Kesalahan:</div>
                          <div className="flex items-center gap-3">
                            <span className="line-through text-red-400 font-medium">{log.old_data.mistakes}</span>
                            <span className="text-gray-300">→</span>
                            <span className="font-bold text-emerald-600">{log.new_data.mistakes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
