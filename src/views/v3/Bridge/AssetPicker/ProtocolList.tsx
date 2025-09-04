import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useMemo, useState } from 'react';

import config from 'config';
import type { ChainConfig, ZapProtocolConfig } from 'config/types';
import PlusIcon from 'icons/Plus';
import SearchableList from 'views/v3/Bridge/AssetPicker/SearchableList';

type Props = {
  selectedProtocol?: string;
  selectedChainConfig?: ChainConfig;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  onProtocolSelect: (protocolId: string) => void;
};

const SHORT_LIST_SIZE = 7;

function ProtocolList(props: Props) {
  const theme = useTheme();
  const [protocolSearchQuery, setProtocolSearchQuery] = useState('');

  const protocols = useMemo(() => {
    return config.zapProtocols;
  }, []);

  const styles = useMemo(
    () => ({
      card: {
        background: theme.palette.input.background,
        maxWidth: '420px',
        [theme.breakpoints.down('sm')]: {
          width: '100vw',
        },
      },
      cardContent: {
        paddingBottom: '0!important',
        [theme.breakpoints.down('sm')]: {
          padding: '16px 10px',
          ':last-child': {
            padding: '16px 10px',
          },
        },
      },
      cardContentSearch: {
        paddingBottom: '0!important',
        paddingLeft: '0!important',
        paddingRight: '0!important',
        paddingTop: '16px',
        [theme.breakpoints.down('sm')]: {
          padding: '16px 0 0 0',
          ':last-child': {
            padding: '16px 0 0 0',
          },
        },
      },
      title: {
        fontSize: '14px',
        marginBottom: '12px',
      },
      chainSearch: {
        maxHeight: '480px',
        padding: '0px',
        width: '100%',
        '& > div:first-of-type': {
          // Override SearchInput padding
          padding: '0 !important',
        },
        [theme.breakpoints.down('sm')]: {
          maxHeight: '640px',
        },
      },
      chainButton: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6px',
        margin: '0px',
        border: '1px solid transparent',
        borderRadius: '50%',
        minHeight: '40px',
        minWidth: '40px',
        maxHeight: '40px',
        maxWidth: '40px',
        width: '40px',
        height: '40px',
        flexShrink: 0,
        '&.Mui-selected': {
          border: '1px solid',
          borderColor: theme.palette.primary.main,
        },
      },
      shortList: {
        padding: '0px',
        margin: '0px',
        gap: '8px',
        '& .MuiListItem-root': {
          padding: '0px',
        },
      },
      chainItem: {
        display: 'flex',
        flexDirection: 'row' as const,
        padding: '8px',
        borderRadius: '8px',
      },
    }),
    [theme],
  );

  const { selectedProtocol, showSearch, setShowSearch, onProtocolSelect } =
    props;

  // Get supported protocols for the selected chain
  const supportedProtocols = useMemo(() => {
    if (!props.selectedChainConfig) return [];

    const chain = props.selectedChainConfig?.sdkName;
    if (!chain) return [];
    return Object.values(protocols).filter((protocol) =>
      protocol?.supportedChains.includes(chain),
    );
  }, [props.selectedChainConfig, protocols]);

  // Convert supported protocols to array for easier manipulation
  const protocolList = useMemo(() => {
    return supportedProtocols.map((protocol) => ({
      ...protocol,
      id: protocol.id,
    }));
  }, [supportedProtocols]);

  const topProviders = useMemo(() => {
    const allProtocols = protocolList ?? [];

    // Find the selected provider in supported providers
    const selectedProviderIndex = allProtocols.findIndex((protocol) => {
      return protocol.id === selectedProtocol;
    });
    // If the selected provider is outside the top list, we add it to the top;
    // otherwise we do not change its index in the top list
    if (
      selectedProtocol &&
      selectedProviderIndex !== -1 &&
      selectedProviderIndex >= SHORT_LIST_SIZE
    ) {
      const selectedProtocolObj = allProtocols.find(
        (p) => p.id === selectedProtocol,
      );
      if (selectedProtocolObj) {
        return [
          selectedProtocolObj,
          ...allProtocols.slice(0, SHORT_LIST_SIZE - 1),
        ];
      }
    }

    return allProtocols.slice(0, SHORT_LIST_SIZE);
  }, [protocolList, selectedProtocol]);

  const showMoreButton = (protocolList?.length ?? 0) > SHORT_LIST_SIZE;

  const shortList = useMemo(() => {
    return (
      <List
        component={Stack}
        direction="row"
        data-testid="provider-short-list"
        sx={styles.shortList}
      >
        {topProviders.map((protocol) => (
          <Tooltip key={protocol.id} title={protocol.name}>
            <ListItemButton
              selected={selectedProtocol === protocol.id}
              sx={styles.chainButton}
              data-testid={`provider-button-${protocol.id.toLowerCase()}`}
              onClick={() => onProtocolSelect(protocol.id)}
            >
              <img
                src={protocol.icon}
                alt={protocol.name}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '100%',
                  display: 'block',
                  margin: 0,
                }}
              />
            </ListItemButton>
          </Tooltip>
        ))}

        {showMoreButton ? (
          <ListItemButton
            sx={styles.chainButton}
            onClick={() => {
              setShowSearch(true);
            }}
          >
            <PlusIcon
              sx={{ height: '36px', width: '36px', borderRadius: '100%' }}
            />
          </ListItemButton>
        ) : null}
      </List>
    );
  }, [
    styles.chainButton,
    styles.shortList,
    onProtocolSelect,
    selectedProtocol,
    setShowSearch,
    showMoreButton,
    topProviders,
  ]);

  const searchList = useMemo(
    () => (
      <SearchableList<ZapProtocolConfig>
        searchPlaceholder="Search for a provider"
        sx={styles.chainSearch}
        items={protocolList ?? []}
        searchQuery={protocolSearchQuery}
        onQueryChange={setProtocolSearchQuery}
        filterFn={(protocol, query) =>
          !query || protocol.name.toLowerCase().includes(query.toLowerCase())
        }
        renderFn={(protocol) => (
          <ListItemButton
            key={protocol.id}
            dense
            sx={styles.chainItem}
            onClick={() => {
              onProtocolSelect(protocol.id);
              setShowSearch(false);
            }}
          >
            <ListItemIcon sx={{ minWidth: '50px' }}>
              <img
                src={protocol?.icon}
                alt={protocol.name}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'block',
                  margin: 0,
                }}
              />
            </ListItemIcon>
            <Typography fontSize="16px" fontWeight={500}>
              {protocol.name}
            </Typography>
          </ListItemButton>
        )}
      />
    ),
    [
      protocolList,
      protocolSearchQuery,
      styles.chainItem,
      styles.chainSearch,
      onProtocolSelect,
      setShowSearch,
    ],
  );

  if (protocolList?.length === 0) {
    return (
      <Typography
        fontSize="14px"
        color="text.secondary"
        textAlign="center"
        sx={{ py: 2 }}
      >
        No protocols available for this chain
      </Typography>
    );
  }

  return (
    <Card sx={styles.card} variant="elevation">
      <CardContent sx={styles.cardContent}>
        <Typography sx={styles.title} fontSize="16px" fontWeight={500}>
          Select a protocol
        </Typography>
        {showSearch ? searchList : shortList}
      </CardContent>
    </Card>
  );
}

export default React.memo(ProtocolList);
