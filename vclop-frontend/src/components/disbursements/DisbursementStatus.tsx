import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import disbursementsService, { DisbursementTransaction } from '../../services/disbursements.service';
import { formatCurrency, formatDate } from '../../utils/format';

interface DisbursementStatusProps {
  entityType: 'LOAN' | 'TRANSPORT' | 'EXPENSE' | 'STAFF_LOAN';
  entityId: string;
  compact?: boolean;
}

const DisbursementStatus: React.FC<DisbursementStatusProps> = ({
  entityType,
  entityId,
  compact = false,
}) => {
  const [disbursements, setDisbursements] = useState<DisbursementTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDisbursements();
  }, [entityType, entityId]);

  const loadDisbursements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await disbursementsService.getForEntity(entityType, entityId);
      setDisbursements(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load disbursement status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: any; icon: React.ReactElement; label: string; description: string }> = {
      PENDING: {
        color: 'warning',
        icon: <PendingIcon />,
        label: 'Pending',
        description: 'Disbursement initiated, waiting to be processed',
      },
      PROCESSING: {
        color: 'info',
        icon: <InfoIcon />,
        label: 'Processing',
        description: 'Transfer in progress via Paystack',
      },
      SUCCESS: {
        color: 'success',
        icon: <SuccessIcon />,
        label: 'Success',
        description: 'Funds successfully transferred to bank account',
      },
      FAILED: {
        color: 'error',
        icon: <ErrorIcon />,
        label: 'Failed',
        description: 'Transfer failed, manual retry required',
      },
      REVERSED: {
        color: 'secondary',
        icon: <ErrorIcon />,
        label: 'Reversed',
        description: 'Transfer was reversed by Paystack',
      },
      CANCELLED: {
        color: 'default',
        icon: <ErrorIcon />,
        label: 'Cancelled',
        description: 'Transfer cancelled',
      },
    };
    return configs[status] || configs.PENDING;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography>Loading disbursement status...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (disbursements.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info" icon={<InfoIcon />}>
            No disbursement initiated yet
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show most recent disbursement
  const latestDisbursement = disbursements[0];
  const statusConfig = getStatusConfig(latestDisbursement.status);

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={statusConfig.icon}
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
        />
        {latestDisbursement.status === 'PROCESSING' && (
          <CircularProgress size={16} />
        )}
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Disbursement Status
        </Typography>

        {latestDisbursement.status === 'PROCESSING' && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Chip
            icon={statusConfig.icon}
            label={statusConfig.label}
            color={statusConfig.color}
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="textSecondary">
            {statusConfig.description}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Amount
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(latestDisbursement.amount)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Initiated
            </Typography>
            <Typography variant="body2">{formatDate(latestDisbursement.initiatedAt)}</Typography>
          </Box>
        </Box>

        {latestDisbursement.completedAt && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary">
              Completed
            </Typography>
            <Typography variant="body2">{formatDate(latestDisbursement.completedAt)}</Typography>
          </Box>
        )}

        {latestDisbursement.accountNumber && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary">
              Bank Account
            </Typography>
            <Typography variant="body2">
              {latestDisbursement.accountNumber} - {latestDisbursement.bankName || latestDisbursement.bankCode}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {latestDisbursement.accountName}
            </Typography>
          </Box>
        )}

        {latestDisbursement.paystackReference && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary">
              Paystack Reference
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {latestDisbursement.paystackReference}
            </Typography>
          </Box>
        )}

        {latestDisbursement.failureReason && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              Failure Reason:
            </Typography>
            <Typography variant="body2">{latestDisbursement.failureReason}</Typography>
          </Alert>
        )}

        {latestDisbursement.retryCount > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This disbursement has been retried {latestDisbursement.retryCount} time(s)
          </Alert>
        )}

        {disbursements.length > 1 && (
          <Typography variant="caption" color="textSecondary">
            {disbursements.length} total disbursement attempt(s)
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default DisbursementStatus;
