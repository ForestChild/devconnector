import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import PostForm from "./PostForm";
import PostFeed from "./PostFeed";
import Spinner from "../common/Spinner";
import { getPosts } from "../../actions/postActions";
import { getProfiles } from "../../actions/profileActions";

class Posts extends Component {

	componentDidMount() {
		//The getPosts and getProfiles action creators cause a backend
		//api call which fetches all of the posts/profiles on the
		//database and sends that information to the reducers. The
		//reducers then feed this information to the redux store.
		//then we use mapStateToProps
		this.props.getProfiles();
		this.props.getPosts();
	}

	render () {
		const { posts, loading } = this.props.post;
		const { profiles } = this.props.profile;
		let postContent;

		if(posts === null || profiles === null || loading) {
			postContent = <Spinner />
		} else {
			postContent = <PostFeed posts={posts} profiles={profiles} />
		}

		return (
			<div className="feed">
				<div className="container">
					<div className="row">
						<div className="col-md-12">
							<PostForm profiles={profiles} />
							{postContent}
						</div>
					</div>
				</div>
			</div>
		)
	}
}

Posts.propTypes = {
	getPosts: PropTypes.func.isRequired,
	getProfiles: PropTypes.func.isRequired,
	posts: PropTypes.object.isRequired,
	profile: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
	post: state.post,
	profile: state.profile
});

export default connect(mapStateToProps, { getPosts, getProfiles })(Posts);