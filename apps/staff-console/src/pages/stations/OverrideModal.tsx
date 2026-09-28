import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useStore } from '../../store/StoreProvider';
import { mmss } from '../../domain/time';
import { Button, Field, inputCls, cx } from '../../ui/kit';
import { Modal } from '../../ui/overlay';

const REASONS = ['测量室排程冲突', '受试者身体不适需提前', '仪器校准窗口', '其他（在备注说明）'];

export function OverrideModal({ visitId, remainSec, onClose }: { visitId: string; remainSec: number; onClose(): void }) {
  const { data, actions } = useStore();
  const supervisors = data.site.people.filter((p) => p.canOverride);
  const [approver, setApprover] = useState(supervisors[0]?.name ?? '');
  const [reason, setReason] = useState(REASONS[0]!);
  const [pin, setPin] = useState('');

  return (
    <Modal
      open
      onClose={onClose}
      title="申请提前开始 T0"
      sub={`平衡还剩 ${mmss(remainSec)}。需督导书面批准，批准后自动生成方案偏离记录。`}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            variant="dark"
            disabled={pin.length < 4}
            onClick={() => {
              actions.overrideBalance(visitId, reason, approver);
              onClose();
            }}
          >
            <ShieldCheck className="size-4" />
            督导签批
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="批准人（仅督导）">
          <select className={inputCls} value={approver} onChange={(e) => setApprover(e.target.value)}>
            {supervisors.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="原因">
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} className={cx('rounded-lg px-3 py-2 text-left text-[13px] ring-1', r === reason ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-200')}>
                {r}
              </button>
            ))}
          </div>
        </Field>
        <Field label="督导电子签名 PIN" hint="原型中任意 4 位数字即可">
          <input className={cx(inputCls, 'font-mono tracking-[.4em]')} value={pin} maxLength={6} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
        </Field>
      </div>
    </Modal>
  );
}
