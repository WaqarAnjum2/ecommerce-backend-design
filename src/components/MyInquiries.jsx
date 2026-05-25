import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MyInquiries = ({ setPage }) => {
  const { getToken } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMine = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/inquiries/mine', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setInquiries(Array.isArray(data) ? data : []);
      } else if (resp.status === 401 || resp.status === 404) {
        // try public fallback
        const pub = await fetch('/api/inquiries/public');
        if (pub.ok) {
          const data = await pub.json();
          setInquiries(Array.isArray(data) ? data : []);
        } else {
          setInquiries([]);
        }
      } else {
        setInquiries([]);
      }
    } catch (err) {
      console.error(err);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMine(); }, []);

  return (
    <div className="container py-8">
      <h2 className="text-2xl font-semibold mb-4">My Inquiries</h2>
      {loading ? (
        <div>Loading...</div>
      ) : inquiries.length === 0 ? (
        <div className="text-sm text-gray-600">You have not created any inquiries yet.</div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((iq) => (
            <div key={iq.id} className="p-4 rounded-lg border bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{iq.subject}</div>
                  <div className="text-xs text-gray-500">{new Date(iq.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-700">Status: <span className="font-medium">{iq.status || 'new'}</span></div>
              </div>
              <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{iq.details}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyInquiries;
