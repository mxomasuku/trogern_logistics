import { useListDriversQuery, useAddDriverMutation } from './driversApi';
import { useState } from 'react';

export default function DriversPage() {
  const { data = [], isLoading } = useListDriversQuery();
  const [addDriver, { isLoading: saving }] = useAddDriverMutation();
  const [name, setName] = useState(''); const [licenseNumber, setLicense] = useState('');
  const [nationalId, setNat] = useState(''); const [contact, setContact] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDriver({ name, licenseNumber, nationalId, contact }).unwrap();
    setName(''); setLicense(''); setNat(''); setContact('');
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Drivers</h2>
      {isLoading ? 'Loading…' : (
        <table>
          <thead><tr><th>Name</th><th>License</th><th>Contact</th></tr></thead>
          <tbody>{data.map((d:any)=>(
            <tr key={d.id}><td>{d.name}</td><td>{d.licenseNumber}</td><td>{d.contact}</td></tr>
          ))}</tbody>
        </table>
      )}
      <h3>Add driver</h3>
      <form onSubmit={submit} style={{ display:'grid', gap: 8, maxWidth: 420 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required />
        <input value={licenseNumber} onChange={e=>setLicense(e.target.value)} placeholder="License" required />
        <input value={nationalId} onChange={e=>setNat(e.target.value)} placeholder="National ID" required />
        <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Contact" required />
        <button disabled={saving} type="submit">{saving ? 'Saving…' : 'Add'}</button>
      </form>
    </div>
  );
}