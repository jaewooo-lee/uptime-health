import React, { useState } from 'react';
import { X, Globe, Server, Radio, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { MonitorType } from '../types';

interface AddMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const AddMonitorModal: React.FC<AddMonitorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<MonitorType>('HTTP');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [port, setPort] = useState<string>('80');
  const [interval, setInterval] = useState<number>(60);
  const [timeout, setTimeoutVal] = useState<number>(10);
  const [maxRetries, setMaxRetries] = useState<number>(1);
  const [expectedStatus, setExpectedStatus] = useState<string>('200-299');
  const [keyword, setKeyword] = useState<string>('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'UP' | 'DOWN';
    responseTime: number;
    message?: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!target.trim()) {
      setErrorMsg('대상 주소를 입력해주세요');
      return;
    }
    setErrorMsg(null);
    setTesting(true);
    setTestResult(null);

    try {
      const payload: any = {
        name: name || 'Test Monitor',
        type,
        target: target.trim(),
        interval,
        timeout,
        max_retries: maxRetries,
        expected_status: type === 'HTTP' ? expectedStatus : null,
        keyword: type === 'HTTP' && keyword.trim() ? keyword.trim() : null,
        port: type === 'TCP' ? parseInt(port, 10) || null : null,
      };

      const res = await fetch('/api/monitors/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Test failed');
      }

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || '테스트 중 오류가 발생했습니다');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg('모니터 이름을 입력해주세요');
    if (!target.trim()) return setErrorMsg('대상 호스트/URL을 입력해주세요');

    setErrorMsg(null);
    setSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        type,
        target: target.trim(),
        port: type === 'TCP' ? parseInt(port, 10) || null : null,
        interval,
        timeout,
        max_retries: maxRetries,
        expected_status: type === 'HTTP' ? expectedStatus : null,
        keyword: type === 'HTTP' && keyword.trim() ? keyword.trim() : null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '모니터 생성에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">새 모니터 추가</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              모니터링 유형
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('HTTP')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'HTTP'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/60 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                HTTP(S)
              </button>
              <button
                type="button"
                onClick={() => setType('TCP')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'TCP'
                    ? 'bg-purple-600/20 text-purple-400 border-purple-500/60 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                TCP Port
              </button>
              <button
                type="button"
                onClick={() => setType('PING')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'PING'
                    ? 'bg-amber-600/20 text-amber-400 border-amber-500/60 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                Ping (ICMP)
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              친숙한 이름
            </label>
            <input
              type="text"
              required
              placeholder="예: 메인 웹 서비스, 프로덕션 DB, 게이트웨이"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {type === 'HTTP' ? 'URL (HTTP / HTTPS)' : '호스트 (IP 또는 도메인)'}
            </label>
            <input
              type="text"
              required
              inputMode={type === 'HTTP' ? 'url' : 'text'}
              placeholder={
                type === 'HTTP'
                  ? 'https://api.my-service.com'
                  : type === 'TCP'
                  ? '192.168.1.10 또는 db.internal'
                  : '8.8.8.8 또는 router.local'
              }
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* TCP Port Field */}
          {type === 'TCP' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                포트 번호 (Port)
              </label>
              <input
                type="number"
                required
                min="1"
                max="65535"
                inputMode="numeric"
                placeholder="예: 3306, 5432, 6379, 80"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          )}

          {/* HTTP Specific: Expected Status Code & Keyword */}
          {type === 'HTTP' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  기대 상태 코드
                </label>
                <input
                  type="text"
                  placeholder="200-299"
                  value={expectedStatus}
                  onChange={(e) => setExpectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  응답 본문 키워드 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: success, ok"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Interval, Timeout, Retries */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                점검 주기 (초)
              </label>
              <input
                type="number"
                min="5"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                타임아웃 (초)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={timeout}
                onChange={(e) => setTimeoutVal(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                최대 재시도
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Pre-test Simulation Box */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">등록 전 사전 연결 테스트</span>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>{testing ? '테스트 중...' : '연결 테스트'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                  testResult.status === 'UP'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {testResult.status === 'UP' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{testResult.status}</span>
                  <span className="text-slate-400">•</span>
                  <span>{testResult.responseTime}ms</span>
                </div>
                <div className="text-[11px] truncate max-w-[180px]">{testResult.message}</div>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '모니터 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
