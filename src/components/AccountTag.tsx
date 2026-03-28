import { useEffect, useState } from 'react';

interface Props {
  account: string;
  color?: string;
}

function useIsDark() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.dataset.theme === 'dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export default function AccountTag({ account, color = '#7a7268' }: Props) {
  const dark = useIsDark();
  const bgAlpha = dark ? '44' : '28';
  const borderAlpha = dark ? 'aa' : '66';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: color + bgAlpha,
        border: `1px solid ${color}${borderAlpha}`,
        color: color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {account}
    </span>
  );
}
