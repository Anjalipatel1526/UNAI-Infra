import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-toastify';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle
} from 'react-icons/hi2';

export const AvailabilityTool: React.FC = () => {
  const { inventory, rentalRequests } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [targetCategory, setTargetCategory] = useState('All');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [checkedResults, setCheckedResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const categories = [
    'Excavators', 'Concrete Mixers', 'Scaffolding', 'Compactors', 
    'Drilling Machines', 'Cutting Machines', 'Generators', 
    'Road Rollers', 'Water Pumps', 'Power Tools', 'Construction Machinery', 
    'Safety Equipment', 'Electrical Tools', 'Hand Tools'
  ];

  const handleCheckAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Please enter both start and return dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot exceed the return date');
      return;
    }

    setHasSearched(true);
    
    // Check overlap for matching equipment
    const results = inventory
      .filter(item => {
        const matchesCategory = targetCategory === 'All' || item.category === targetCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.equipmentId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .map(item => {
        // Find approved overlapping rental requests
        const overlappingRequests = rentalRequests.filter(req => {
          if (req.status !== 'Approved') return false;
          
          const hasItem = req.items.some(reqItem => reqItem.equipmentId === item.equipmentId);
          if (!hasItem) return false;

          const reqStart = new Date(req.startDate);
          const reqEnd = new Date(req.expectedReturnDate);
          const targetStart = new Date(startDate);
          const targetEnd = new Date(endDate);

          // Overlap condition
          return (targetStart <= reqEnd) && (targetEnd >= reqStart);
        });

        // Current status is Overlapped if there is any approved request in this date range
        let calculatedStatus: 'Available' | 'Overlapped' | 'Maintenance' | 'Damaged' = 'Available';
        if (item.status === 'Maintenance') {
          calculatedStatus = 'Maintenance';
        } else if (item.status === 'Damaged') {
          calculatedStatus = 'Damaged';
        } else if (overlappingRequests.length > 0) {
          calculatedStatus = 'Overlapped';
        }

        return {
          item,
          status: calculatedStatus,
          overlapDetails: overlappingRequests[0] || null
        };
      });

    setCheckedResults(results);
    toast.success(`Queried availability for ${results.length} equipment assets.`);
  };

  return (
    <div className="space-y-6 text-left text-xs">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-brand-text tracking-tight m-0">Equipment Scheduling Checker</h1>
        <p className="text-xs text-brand-dark-grey mt-0.5">Audit scheduling blocks, reserve inventory, and query overlapping contracts.</p>
      </div>

      {/* Query Form Panel */}
      <Card>
        <CardBody>
          <form onSubmit={handleCheckAvailability} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-3 text-brand-dark-grey h-4 w-4" />
                <input
                  type="text"
                  placeholder="Query by ID, brand, model..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-brand-border rounded-lg text-xs transition-all focus:outline-none focus:border-primary text-brand-text"
                />
              </div>

              <select
                value={targetCategory}
                onChange={e => setTargetCategory(e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs bg-white focus:outline-none focus:border-primary text-brand-text font-semibold"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <Input
                label="Target Start Date"
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />

              <Input
                label="Target Return Date"
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end pt-2 border-t border-brand-border/40">
              <Button variant="primary" size="md" type="submit" leftIcon={<HiOutlineCalendarDays />}>
                Check Target Availability
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Query Results */}
      <Card>
        <CardHeader>
          <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Availability Status Registry</h3>
        </CardHeader>
        <CardBody className="p-0">
          {hasSearched ? (
            checkedResults.length > 0 ? (
              <div className="divide-y divide-brand-border">
                {checkedResults.map(({ item, status, overlapDetails }) => (
                  <div key={item.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-brand-light-grey/40 transition-colors">
                    <div className="flex gap-4">
                      <img src={item.images[0]} alt={item.name} className="h-16 w-20 rounded-lg object-cover border border-brand-border" />
                      <div>
                        <h4 className="font-extrabold text-brand-text text-sm leading-tight">{item.name}</h4>
                        <span className="block text-[10px] text-brand-dark-grey mt-1">ID: <strong>{item.equipmentId}</strong> | Category: <strong>{item.category}</strong></span>
                        <p className="font-bold text-primary mt-1.5">₹{item.rentalPriceDay.toLocaleString('en-IN')}/day</p>
                      </div>
                    </div>

                    {/* Status Box */}
                    <div className="text-left md:text-right space-y-2">
                      <div className="flex items-center md:justify-end gap-2">
                        {status === 'Available' && (
                          <>
                            <HiOutlineCheckCircle className="h-5 w-5 text-green-600" />
                            <Badge variant="success">Available for Booking</Badge>
                          </>
                        )}
                        {status === 'Overlapped' && (
                          <>
                            <HiOutlineExclamationCircle className="h-5 w-5 text-amber-600" />
                            <Badge variant="warning">Lock Overlap</Badge>
                          </>
                        )}
                        {(status === 'Maintenance' || status === 'Damaged') && (
                          <>
                            <HiOutlineExclamationCircle className="h-5 w-5 text-red-600" />
                            <Badge variant="danger">{status}</Badge>
                          </>
                        )}
                      </div>

                      {status === 'Overlapped' && overlapDetails && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg max-w-sm text-[10px] leading-relaxed text-brand-text">
                          <span className="font-bold text-primary block mb-0.5">Booking Conflict Details:</span>
                          Billed to: <strong className="text-brand-text">{overlapDetails.companyName}</strong><br />
                          Dates: <strong className="text-brand-text">{overlapDetails.startDate} to {overlapDetails.expectedReturnDate}</strong><br />
                          Invoice: <strong className="text-brand-text font-mono">{overlapDetails.invoiceNumber}</strong>
                        </div>
                      )}

                      {status === 'Available' && (
                        <Button variant="outline" size="sm" onClick={() => toast.success(`Added ${item.name} to cart. Propose new request in rental page.`)}>
                          Pre-Allocate Unit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState title="No Assets Match Query" description="Refine your text parameters or categories and check again." />
              </div>
            )
          ) : (
            <div className="p-12 text-center text-brand-dark-grey">
              <HiOutlineCalendarDays className="h-10 w-10 text-brand-dark-grey/40 mx-auto mb-3" />
              <p className="font-semibold text-xs text-brand-text">Awaiting input check parameters...</p>
              <p className="text-[10px] text-brand-dark-grey mt-1">Specify equipment parameters and target dates above to evaluate operational availability.</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
export default AvailabilityTool;
