import { convertZ1ToUni, detectZawgyi } from '../converter';

type WorkerRequest = {
  id?: number;
  method: string;
  payload: { inputs?: string[]; convert?: boolean };
};
type WorkerResponse = {
  id?: number;
  results: Array<{
    input: string;
    isMyanmar: boolean;
    isZawgyi: boolean;
    converted?: string;
  }>;
};

self.addEventListener('message', (e: MessageEvent) => {
  const msg = e.data as WorkerRequest;
  if (!msg || !msg.method) return;
  if (msg.method === 'detectAndConvert') {
    const inputs: string[] = msg.payload.inputs || [];
    const convert = !!msg.payload.convert;
    const results = inputs.map((s) => {
      const isMyanmar = /[\u1000-\u109F]/u.test(s);
      const isZg = detectZawgyi(s);
      const converted =
        convert && isMyanmar && isZg ? convertZ1ToUni(s) : undefined;
      return { input: s, isMyanmar, isZawgyi: isZg, converted };
    });
    const resp: WorkerResponse = { id: msg.id, results };
    (self as unknown as Worker).postMessage(resp);
  }
});
