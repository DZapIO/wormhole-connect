import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import React, { memo, useCallback, useState } from 'react';

import type { ZapQuoteResult } from 'hooks/useFetchZapQuotes';
import Eta from './Eta';
import RoutesMobile from './RoutesBottomSheet';
import RoutesLink from './RoutesLink';
import RoutesLoader from './RoutesLoader';
import RoutesDesktop from './RoutesModal';

type Props = {
  selectedRoute: ZapQuoteResult;
  isLoading: boolean;
};

function Routes({ selectedRoute, isLoading }: Props) {
  const theme: any = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  // Event handlers
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleToggleRoutes = useCallback(() => {
    if (mobile) {
      setShowDrawer(true);
    } else {
      setShowModal((prev) => !prev);
    }
  }, [mobile]);

  // Done fetching and no routes are available.
  // This can be an error case which the message is shown by the parent component.
  if (!isLoading && selectedRoute?.success === false) {
    return <></>;
  }

  return (
    <>
      {isLoading ? (
        <RoutesLoader />
      ) : (
        <>
          <Stack
            sx={{
              width: '100%',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                width: '100%',
                height: '18px',
              }}
            >
              <RoutesLink onClick={handleToggleRoutes} />
              <Eta route={selectedRoute} />
            </Box>
          </Stack>
        </>
      )}
      {mobile ? (
        <RoutesMobile
          open={showDrawer}
          onOpen={() => setShowDrawer(true)}
          route={selectedRoute}
        />
      ) : (
        <RoutesDesktop
          open={showModal}
          onClose={handleCloseModal}
          route={selectedRoute}
        />
      )}
    </>
  );
}

export default memo(Routes);
