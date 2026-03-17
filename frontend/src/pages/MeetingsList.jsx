import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function MeetingsList() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Auto-refresh every 30 seconds to update active status & joined state
  useEffect(() => {
    const interval = setInterval(fetchMeetings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMeetings = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/meetings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch meetings');
      }

      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch (err) {
      setError(err.message || 'Could not load meetings.');
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async (code) => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`/api/meetings/join/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to join meeting');
        return;
      }

      // Success – go to the main meeting room
      navigate(`/meeting/${code}`);
    } catch (err) {
      alert('Error joining meeting. Please try again.');
    }
  };

  // Check if the meeting is currently active (between start and end time on the same day)
  const isMeetingActive = useCallback((meeting) => {
    const now = new Date();
    const meetingDay = new Date(meeting.meeting_date);
    const start = new Date(`${meeting.meeting_date}T${meeting.start_time}`);
    const end = new Date(`${meeting.meeting_date}T${meeting.end_time}`);

    return (
      now.getFullYear() === meetingDay.getFullYear() &&
      now.getMonth() === meetingDay.getMonth() &&
      now.getDate() === meetingDay.getDate() &&
      now >= start &&
      now <= end
    );
  }, []);

  // Format date nicely
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time (HH:MM only)
  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const date = new Date(`1970-01-01T${timeStr}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        Loading meetings...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: 'red' }}>
        <h3>Error: {error}</h3>
        <button
          onClick={fetchMeetings}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#6C63FF',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>Available Meetings</h1>

      {meetings.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>
          No upcoming meetings found.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {meetings.map((m) => {
            const active = isMeetingActive(m);

            return (
              <div
                key={m.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '24px',
                  background: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                <h3 style={{ margin: '0 0 12px', color: '#333' }}>{m.title}</h3>

                <p style={{ margin: '6px 0' }}>
                  <strong>Date:</strong> {formatDate(m.meeting_date)}
                </p>

                <p style={{ margin: '6px 0' }}>
                  <strong>Time:</strong> {formatTime(m.start_time)} – {formatTime(m.end_time)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0' }}>
                  <span>
                    <strong>Code:</strong> <code style={{ fontSize: '1.15em' }}>{m.meeting_code}</code>
                  </span>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.meeting_code);
                      alert('Meeting code copied to clipboard!');
                    }}
                    style={{
                      padding: '6px 14px',
                      background: '#f0f8ff',
                      color: '#0066cc',
                      border: '1px solid #99ccff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.95em',
                    }}
                  >
                    Copy Code
                  </button>
                </div>

                <button
                  onClick={() => joinMeeting(m.meeting_code)}
                  disabled={!active}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: !active ? '#cccccc' : m.isJoined ? '#4CAF50' : '#6C63FF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: !active ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1em',
                    marginTop: '16px',
                  }}
                >
                  {m.isJoined ? 'Rejoin Meeting' : !active ? 'Meeting Not Active' : 'Join Meeting'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 28px',
            background: '#f5f5f5',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.05em',
            marginRight: '15px',
          }}
        >
          ← Back to Dashboard
        </button>

        <button
          onClick={fetchMeetings}
          style={{
            padding: '12px 28px',
            background: '#6C63FF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.05em',
          }}
        >
          Refresh List
        </button>
      </div>
    </div>
  );
}

export default MeetingsList;
