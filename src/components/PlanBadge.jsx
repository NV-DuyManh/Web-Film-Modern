import { getPlanAppearance } from '../utils/planAppearance';
import { FaTicketAlt, FaShieldAlt, FaCrown, FaGem } from 'react-icons/fa';

const planIcons = { slate: FaTicketAlt, cyan: FaShieldAlt, yellow: FaCrown, rose: FaGem, admin: FaShieldAlt };

export default function PlanBadge({ plan, className = '', children, showIcon = false }) {
    if (!plan) return null;
    const appearance = getPlanAppearance(plan);
    const Icon = planIcons[appearance.theme];
    return (
        <span data-plan-tier={appearance.theme} className={`inline-flex w-fit max-w-full shrink-0 self-start items-center justify-center gap-1.5 whitespace-nowrap border rounded-md px-2 py-0.5 text-[10px] font-bold ${appearance.className} ${className}`}>
            {showIcon && <Icon aria-hidden="true" className="shrink-0" />}
            {children || plan.name || plan.planName}
        </span>
    );
}
