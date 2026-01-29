import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  getClients,
  saveClient,
  updateClient,
  deleteClient
} from '@/lib/workforceData';

export function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'active',
    billable: true,
    contactEmail: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    setClients(getClients());
  };

  const handleAdd = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      code: '',
      status: 'active',
      billable: true,
      contactEmail: ''
    });
    setShowDialog(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      code: client.code,
      status: client.status,
      billable: client.billable,
      contactEmail: client.contactEmail || ''
    });
    setShowDialog(true);
  };

  const handleDelete = (client) => {
    if (confirm(`Are you sure you want to delete "${client.name}"?`)) {
      deleteClient(client.id);
      loadClients();
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      alert('Name and Code are required');
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, formData);
    } else {
      saveClient(formData);
    }

    loadClients();
    setShowDialog(false);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Clients</h3>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billable</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No clients found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              clients.map(client => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.billable ? (
                      <Badge variant="default">Billable</Badge>
                    ) : (
                      <Badge variant="secondary">Non-billable</Badge>
                    )}
                  </TableCell>
                  <TableCell>{client.contactEmail || '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edit Client' : 'Add Client'}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Update client information.'
                : 'Add a new client to the system.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Client name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                placeholder="CLIENT_CODE"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                placeholder="billing@client.com"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="billable">Billable</Label>
              <Switch
                id="billable"
                checked={formData.billable}
                onCheckedChange={(checked) => handleFieldChange('billable', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="status">Active</Label>
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={(checked) =>
                  handleFieldChange('status', checked ? 'active' : 'inactive')
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingClient ? 'Save Changes' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
