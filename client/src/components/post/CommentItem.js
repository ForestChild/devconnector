import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { deleteComment } from "../../actions/postActions";

class CommentItem extends Component {
  onDeleteClick = (postId, commentId) => {
    this.props.deleteComment(postId, commentId);
  }

	render() {
		const { comment, postId, auth } = this.props;

		return (
			<div className="card card-body mb-3">
              <div className="row">
                <div className="col-md-2">
                  { comment.usersProfileHandle ? 
                    (<Link to={`/profile/${comment.usersProfileHandle}`}>
                    <img className="rounded-circle d-none d-md-block" src="https://www.gravatar.com/avatar/anything?s=200&d=mm"
                      alt="" />
                  </Link>) :
                    (<img className="rounded-circle d-none d-md-block" src="https://www.gravatar.com/avatar/anything?s=200&d=mm"
                      alt="" />)
                  }
                  <br />
                  <p className="text-center">{comment.name}</p>
                </div>
                <div className="col-md-10">
                  <p className="lead">
                  {comment.text}
                  </p>
                  {comment.user === auth.user.id ? (
                    <button onClick={this.onDeleteClick.bind(this, postId, comment._id)}
                    type="button"
                    className="btn btn-danger mr-1">
                      <i className="fas fa-times" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
		)
	}
}

CommentItem.propTypes = {
	comment: PropTypes.object.isRequired,
	deleteComment: PropTypes.func.isRequired,
	auth: PropTypes.object.isRequired,
	postId: PropTypes.string.isRequired
}

const mapStateToProps = state => ({
	auth: state.auth
})

export default connect(mapStateToProps, { deleteComment })(CommentItem);