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
import { useSelector } from 'react-redux';

import type { ProviderDetails } from '@dzapio/sdk';
import type { ChainConfig } from 'config/types';
import PlusIcon from 'icons/Plus';
import type { RootState } from 'store';
import { getChainId } from 'utils/chainMapping';
import SearchableList from 'views/v3/Bridge/AssetPicker/SearchableList';

type Props = {
  selectedProvider?: string;
  selectedChainConfig?: ChainConfig;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  onProviderSelect: (providerId: string) => void;
};

const SHORT_LIST_SIZE = 7;

function ProtocolList(props: Props) {
  const theme = useTheme();
  const [providerSearchQuery, setProviderSearchQuery] = useState('');
  const { providers, zappingChains } = useSelector(
    (state: RootState) => state.transferInput,
  );

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

  const { selectedProvider, showSearch, setShowSearch, onProviderSelect } =
    props;

  // Get supported protocols for the selected chain
  const supportedProtocols = useMemo(() => {
    if (!props.selectedChainConfig) return [];

    const chainId = getChainId(props.selectedChainConfig.sdkName);
    if (!chainId) return [];

    // Convert chainId to string since zappingChains keys are string chain IDs
    const chainIdKey = chainId.toString();

    return (
      zappingChains[chainIdKey]?.supportedProviders
        ?.map((provider: string) => providers[provider])
        ?.filter((provider) => provider !== undefined) || []
    );
  }, [props.selectedChainConfig, zappingChains, providers]);

  // Convert supported protocols to array for easier manipulation
  const providerList = useMemo(() => {
    return supportedProtocols.map((provider) => ({
      ...provider,
      id: provider.id,
    }));
  }, [supportedProtocols, providers]);

  const topProviders = useMemo(() => {
    const allProviders = providerList ?? [];

    // Find the selected provider in supported providers
    const selectedProviderIndex = allProviders.findIndex((provider) => {
      return provider.id === selectedProvider;
    });
    // If the selected provider is outside the top list, we add it to the top;
    // otherwise we do not change its index in the top list
    if (
      selectedProvider &&
      selectedProviderIndex &&
      selectedProviderIndex >= SHORT_LIST_SIZE
    ) {
      const selectedProviderObj = allProviders.find(
        (p) => p.id === selectedProvider,
      );
      if (selectedProviderObj) {
        return [
          selectedProviderObj,
          ...allProviders.slice(0, SHORT_LIST_SIZE - 1),
        ];
      }
    }

    return allProviders.slice(0, SHORT_LIST_SIZE);
  }, [providerList, selectedProvider]);

  const showMoreButton = (providerList?.length ?? 0) > SHORT_LIST_SIZE;

  const shortList = useMemo(() => {
    return (
      <List
        component={Stack}
        direction="row"
        data-testid="provider-short-list"
        sx={styles.shortList}
      >
        {topProviders.map((provider) => (
          <Tooltip key={provider.id} title={provider.name}>
            <ListItemButton
              selected={selectedProvider === provider.id}
              sx={styles.chainButton}
              data-testid={`provider-button-${provider.id.toLowerCase()}`}
              onClick={() => onProviderSelect(provider.id)}
            >
              <img
                src={provider.icon}
                alt={provider.name}
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
    onProviderSelect,
    selectedProvider,
    setShowSearch,
    showMoreButton,
    topProviders,
  ]);

  const searchList = useMemo(
    () => (
      <SearchableList<ProviderDetails>
        searchPlaceholder="Search for a provider"
        sx={styles.chainSearch}
        items={providerList ?? []}
        searchQuery={providerSearchQuery}
        onQueryChange={setProviderSearchQuery}
        filterFn={(provider, query) =>
          !query || provider.name.toLowerCase().includes(query.toLowerCase())
        }
        renderFn={(provider) => (
          <ListItemButton
            key={provider.id}
            dense
            sx={styles.chainItem}
            onClick={() => {
              onProviderSelect(provider.id);
              setShowSearch(false);
            }}
          >
            <ListItemIcon sx={{ minWidth: '50px' }}>
              <img
                src={provider.icon}
                alt={provider.name}
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
              {provider.name}
            </Typography>
          </ListItemButton>
        )}
      />
    ),
    [
      providerList,
      providerSearchQuery,
      styles.chainItem,
      styles.chainSearch,
      onProviderSelect,
      setShowSearch,
    ],
  );

  if (topProviders.length < 2) {
    return null;
  }

  return (
    <Card sx={styles.card} variant="elevation">
      <CardContent sx={styles.cardContent}>
        <Typography sx={styles.title} fontSize="16px" fontWeight={500}>
          Select a provider
        </Typography>
        {showSearch ? searchList : shortList}
      </CardContent>
    </Card>
  );
}

export default React.memo(ProtocolList);
