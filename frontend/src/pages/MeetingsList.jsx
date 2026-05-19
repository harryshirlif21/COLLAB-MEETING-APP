import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Calendar, Clock, Copy, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function MeetingsList() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, []);

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
      const res = await fetch('http://localhost:5000/api/meetings', {
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
      const res = await fetch(`http://localhost:5000/api/meetings/join/${code}`, {
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

      navigate(`/meeting/${code}`);
    } catch (err) {
      alert('Error joining meeting. Please try again.');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const date = new Date(`1970-01-01T${timeStr}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading meetings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-danger mb-4">Error: {error}</h3>
          <Button onClick={fetchMeetings}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-display mb-2">Available Meetings</h1>
          <p className="text-text-secondary">Join or manage your scheduled meetings</p>
        </div>
        <Button onClick={fetchMeetings} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      {meetings.length === 0 ? (
        <Card className="text-center py-12">
          <Video className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">No upcoming meetings found.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meetings.map((m, index) => {
            const active = isMeetingActive(m);

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-text-primary font-display mb-3">{m.title}</h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(m.meeting_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(m.start_time)} – {formatTime(m.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-text-secondary font-medium">Code:</span>
                          <code className="bg-surface px-3 py-1 rounded-lg text-primary font-mono">{m.meeting_code}</code>
                          <Button
                            onClick={() => copyCode(m.meeting_code)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            {copiedCode === m.meeting_code ? (
                              <CheckCircle2 className="w-4 h-4 text-secondary" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-3 sm:min-w-[200px]">
                      <Button
                        onClick={() => joinMeeting(m.meeting_code)}
                        disabled={!active}
                        variant={m.isJoined ? 'secondary' : 'primary'}
                        className="w-full sm:w-auto"
                      >
                        {m.isJoined ? 'Rejoin Meeting' : !active ? 'Meeting Not Active' : 'Join Meeting'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center gap-4 pt-4"
      >
        <Button onClick={() => navigate('/Dashboard')} variant="ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}

export default MeetingsList;
