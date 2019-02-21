import React, { Component } from "react";
import PropTypes from "prop-types";
import PostItem from "./PostItem";
import { connect } from "react-redux";


class PostFeed extends Component {

	render () {
		const { posts, profiles } = this.props;
		
		return posts.map(post => 
			<PostItem 
			key={post._id}
			post={post}
			handle={(profiles.filter(profile =>
			//make sure the profile exists before looking for its handle
			//I think this is necessary because of component lifecycle
			//hooks or... I'm not sure. getProfiles doesnt reliably return
			//the updated profiles collection from the database before postFeed
			//tries to render.
			//This was a good exercise but denormalization
			//is much simpler in this case. (I provide User and Post model
			// and comments with their creators handles) just provide post.usersProfileHandle here
				{if(profile.user._id === post.user) {
					return profile;
				}
			}).length !== 0)
			? (profiles.filter(profile => {
				if(profile.user._id === post.user) {
					return profile.handle
				}
			})[0].handle) : (null) }
			/>
		)
	}
}

PostFeed.propTypes = {
	profile: PropTypes.array.isRequired,
	posts: PropTypes.array.isRequired
}

export default PostFeed;