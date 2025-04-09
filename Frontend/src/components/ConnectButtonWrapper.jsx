import { forwardRef } from 'react';
import { ConnectButton as SuietConnectButton } from '@suiet/wallet-kit';

// Create a wrapper component that properly handles refs in React 19
const ConnectButtonWrapper = forwardRef((props, ref) => {
  return <SuietConnectButton {...props} forwardedRef={ref} className={`rounded-md px-4 py-2 text-white transition-colors disabled:opacity-50`} />;
});

ConnectButtonWrapper.displayName = 'ConnectButtonWrapper';

export default ConnectButtonWrapper;