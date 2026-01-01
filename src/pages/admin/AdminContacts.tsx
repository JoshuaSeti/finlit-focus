import { useState } from 'react';
import { Mail, Phone, Calendar, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mockContactForms, type ContactForm } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'resolved', label: 'Resolved' },
];

const AdminContacts = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactForm[]>(mockContactForms);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedContact, setSelectedContact] = useState<ContactForm | null>(null);

  const filteredContacts = contacts.filter(c => 
    filterStatus === 'all' || c.status === filterStatus
  );

  const updateStatus = (id: string, status: ContactForm['status']) => {
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, status } : c
    ));
    toast({ title: `Status updated to ${status}` });
  };

  const getStatusIcon = (status: ContactForm['status']) => {
    switch (status) {
      case 'new':
        return <Clock size={14} className="text-primary" />;
      case 'contacted':
        return <Mail size={14} className="text-yellow-600" />;
      case 'resolved':
        return <CheckCircle size={14} className="text-green-600" />;
    }
  };

  const getStatusColor = (status: ContactForm['status']) => {
    switch (status) {
      case 'new':
        return 'bg-primary/10 text-primary';
      case 'contacted':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'resolved':
        return 'bg-green-600/10 text-green-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Forms</h1>
          <p className="text-muted-foreground">View and manage school inquiries.</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-soft text-center">
          <div className="text-2xl font-bold text-primary">
            {contacts.filter(c => c.status === 'new').length}
          </div>
          <div className="text-sm text-muted-foreground">New</div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-soft text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {contacts.filter(c => c.status === 'contacted').length}
          </div>
          <div className="text-sm text-muted-foreground">Contacted</div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-soft text-center">
          <div className="text-2xl font-bold text-green-600">
            {contacts.filter(c => c.status === 'resolved').length}
          </div>
          <div className="text-sm text-muted-foreground">Resolved</div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No contact forms found with the selected filter.
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div 
              key={contact.id}
              className="bg-card rounded-xl p-4 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-foreground">{contact.schoolName}</h3>
                    <span className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      getStatusColor(contact.status)
                    )}>
                      {getStatusIcon(contact.status)}
                      {contact.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{contact.contactPerson}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {contact.email}
                    </span>
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {contact.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(contact.date).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded-full">
                      {contact.requestType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <Eye size={16} className="mr-1" />
                    View
                  </Button>
                  <Select
                    value={contact.status}
                    onValueChange={(value) => updateStatus(contact.id, value as ContactForm['status'])}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Form Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">School/Organization</p>
                  <p className="font-medium text-foreground">{selectedContact.schoolName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contact Person</p>
                  <p className="font-medium text-foreground">{selectedContact.contactPerson}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <a href={`mailto:${selectedContact.email}`} className="font-medium text-primary hover:underline">
                    {selectedContact.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium text-foreground">{selectedContact.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Request Type</p>
                  <p className="font-medium text-foreground">{selectedContact.requestType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date Submitted</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedContact.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" asChild>
                  <a href={`mailto:${selectedContact.email}`}>
                    <Mail size={16} className="mr-2" />
                    Send Email
                  </a>
                </Button>
                <Button onClick={() => setSelectedContact(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContacts;
