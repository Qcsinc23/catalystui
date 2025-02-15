import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

function CommentThread({ comment, onReply, onDelete, depth = 0 }) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const maxDepth = 3; // Limit nesting depth

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyForm(false);
  };

  const canModifyComment = comment.createdById === user?.id || 
    ['admin', 'manager'].includes(user?.role);

  return (
    <div className={`${depth > 0 ? 'ml-6 mt-3 border-l-2 border-gray-200 pl-4' : 'mb-4'}`}>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{comment.createdByName}</span>
            <span className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
            {comment.createdAt !== comment.updatedAt && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
          {canModifyComment && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </div>
        <p className="mt-2 text-gray-900 whitespace-pre-wrap">{comment.content}</p>
        {depth < maxDepth && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              {showReplyForm ? 'Cancel Reply' : 'Reply'}
            </button>
          </div>
        )}
      </div>

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-3 space-y-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!replyContent.trim()}
              className="btn btn-primary btn-sm"
            >
              Reply
            </button>
          </div>
        </form>
      )}

      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentList({ entityType, entityId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchComments(1, false);
  }, [entityType, entityId]);

  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(
        `/api/${entityType}s/${entityId}/comments?page=${pageNum}&limit=10`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const { data } = await response.json();
      
      // Update pagination state
      setHasMore(data.pagination.page < data.pagination.totalPages);
      
      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        data.comments.map(async (comment) => {
          const repliesResponse = await fetch(
            `/api/comments/${comment.id}/replies?limit=100`,
            { credentials: 'include' }
          );
          if (repliesResponse.ok) {
            const repliesData = await repliesResponse.json();
            return { ...comment, replies: repliesData.data.replies };
          }
          return { ...comment, replies: [] };
        })
      );

      if (append) {
        setComments(prevComments => [...prevComments, ...commentsWithReplies]);
      } else {
        setComments(commentsWithReplies);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/${entityType}s/${entityId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      setNewComment('');
      await fetchComments(1, false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId, content) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/${entityType}s/${entityId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content,
          parentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      await fetchComments(1, false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      await fetchComments(1, false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-2">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="btn btn-primary"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500">No comments yet</p>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchComments(nextPage, true);
                  }}
                  disabled={loadingMore}
                  className="btn btn-secondary"
                >
                  {loadingMore ? 'Loading...' : 'Load More Comments'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
