import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Replay as RetryIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Block as CancelledIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import disbursementsService, { DisbursementTransaction } from '../../../services/disbursements.service';
import { formatCurrency, formatDate } from '../../../utils/format';
import PageHeader from '../../../components/PageHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const DisbursementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [pendingDisbursements, setPendingDisbursements] = useState<DisbursementTransaction[]>([]);
  const [failedDisbursements, setFailedDisbursements] = useState<DisbursementTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementTransaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadDisbursements();
  }, [tabValue, entityTypeFilter]);

  const loadDisbursements = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tabValue === 0) {
        const response = await disbursementsService.getPending(entityTypeFilter || undefined);
        setPendingDisbursements(response.data);
      } else {
        const response = await disbursementsService.getFailed(entityTypeFilter || undefined);
        setFailedDisbursements(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load disbursements');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await disbursementsService.retry(id);
      await loadDisbursements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retry disbursement');
    } finally {
      setRetryingId(null);
    }
  };

  const handleViewDetails = async (disbursement: DisbursementTransaction) => {
    setSelectedDisbursement(disbursement);
    setDetailsOpen(true);
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { color: any; icon: React.ReactElement; label: string }> = {
      PENDING: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      PROCESSING: { color: 'info', icon: <PendingIcon />, label: 'Processing' },
      SUCCESS: { color: 'success', icon: <SuccessIcon />, label: 'Success' },
      FAILED: { color: 'error', icon: <ErrorIcon />, label: 'Failed' },
      REVERSED: { color: 'secondary', icon: <CancelledIcon />, label: 'Reversed' },
      CANCELLED: { color: 'default', icon: <CancelledIcon />, label: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" />;
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      LOAN: 'Loan Disbursement',
      TRANSPORT: 'Transport Reimbursement',
      EXPENSE: 'Expense Reimbursement',
      STAFF_LOAN: 'Staff Loan',
      SALARY: 'Salary Payment',
      BONUS: 'Bonus Payment',
      OTHER: 'Other Payment',
    };
    return labels[type] || type;
  };

  const renderDisbursementTable = (disbursements: DisbursementTransaction[]) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Recipient</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Bank Details</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Initiated</TableCell>
            <TableCell>Purpose</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {disbursements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography color="textSecondary" sx={{ py: 3 }}>
                  No disbursements found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            disbursements.map((disbursement) => (
              <TableRow key={disbursement.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {getEntityTypeLabel(disbursement.entityType)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {disbursement.recipientType}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{disbursement.recipientName || 'N/A'}</Typography>
                  {disbursement.initiatedBy && (
                    <Typography variant="caption" color="textSecondary">
                      by {disbursement.initiatedBy.firstName} {disbursement.initiatedBy.lastName}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(disbursement.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{disbursement.accountNumber || 'N/A'}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {disbursement.bankName || disbursement.bankCode || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>{getStatusChip(disbursement.status)}</TableCell>
                <TableCell>
                  <Typography variant="body2">{formatDate(disbursement.initiatedAt)}</Typography>
                  {disbursement.retryCount > 0 && (
                    <Typography variant="caption" color="error">
                      Retries: {disbursement.retryCount}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title={disbursement.purpose || 'No description'}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {disbursement.purpose || 'No description'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => handleViewDetails(disbursement)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  {disbursement.status === 'FAILED' && (
                    <Tooltip title="Retry Disbursement">
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleRetry(disbursement.id)}
                          disabled={retryingId === disbursement.id}
                        >
                          {retryingId === disbursement.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <RetryIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Disbursements Management"
        subtitle="Monitor and manage automatic bank transfers via Paystack"
        actions={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={entityTypeFilter}
                label="Filter by Type"
                onChange={(e) => setEntityTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="LOAN">Loan Disbursements</MenuItem>
                <MenuItem value="TRANSPORT">Transport</MenuItem>
                <MenuItem value="EXPENSE">Expenses</MenuItem>
                <MenuItem value="STAFF_LOAN">Staff Loans</MenuItem>
                <MenuItem value="SALARY">Salary</MenuItem>
                <MenuItem value="BONUS">Bonus</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadDisbursements}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Pending & Processing
                  {!loading && pendingDisbursements.length > 0 && (
                    <Chip label={pendingDisbursements.length} size="small" color="warning" />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Failed
                  {!loading && failedDisbursements.length > 0 && (
                    <Chip label={failedDisbursements.length} size="small" color="error" />
                  )}
                </Box>
              }
            />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TabPanel value={tabValue} index={0}>
                {renderDisbursementTable(pendingDisbursements)}
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                {renderDisbursementTable(failedDisbursements)}
              </TabPanel>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Disbursement Details</DialogTitle>
        <DialogContent>
          {selectedDisbursement && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Transaction Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedDisbursement.status)}</Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(selectedDisbursement.amount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Type
                  </Typography>
                  <Typography variant="body1">
                    {getEntityTypeLabel(selectedDisbursement.entityType)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Recipient
                  </Typography>
                  <Typography variant="body1">{selectedDisbursement.recipientName}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedDisbursement.recipientType}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom>
                Bank Details
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Account Number
                  </Typography>
                  <Typography variant="body1">{selectedDisbursement.accountNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Account Name
                  </Typography>
                  <Typography variant="body1">{selectedDisbursement.accountName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Bank
                  </Typography>
                  <Typography variant="body1">
                    {selectedDisbursement.bankName || selectedDisbursement.bankCode}
                  </Typography>
                </Box>
              </Box>

              {selectedDisbursement.paystackTransferCode && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Paystack Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Transfer Code
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {selectedDisbursement.paystackTransferCode}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Reference
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {selectedDisbursement.paystackReference}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

              {selectedDisbursement.failureReason && (
                <>
                  <Typography variant="h6" gutterBottom color="error">
                    Failure Reason
                  </Typography>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {selectedDisbursement.failureReason}
                  </Alert>
                </>
              )}

              <Typography variant="h6" gutterBottom>
                Timeline
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Initiated At
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedDisbursement.initiatedAt)}</Typography>
                </Box>
                {selectedDisbursement.completedAt && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Completed At
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedDisbursement.completedAt)}
                    </Typography>
                  </Box>
                )}
                {selectedDisbursement.retryCount > 0 && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Retry Count
                    </Typography>
                    <Typography variant="body1">{selectedDisbursement.retryCount}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedDisbursement?.status === 'FAILED' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<RetryIcon />}
              onClick={() => {
                handleRetry(selectedDisbursement.id);
                setDetailsOpen(false);
              }}
            >
              Retry Disbursement
            </Button>
          )}
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DisbursementsPage;
