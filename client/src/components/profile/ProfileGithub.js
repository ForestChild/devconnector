import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

class ProfileGithub extends Component {
	constructor(props) {
		super(props);
		this.state = {
			clientId: "",
			clientSecret: "",
			count: 5,
			sort: "created: asc",
			repos: []
		}
		this.myRef = React.createRef();
	}
	componentDidMount() {
    const { username } = this.props;
    const { count, sort } = this.state;
 
    fetch(`/api/profile/github/${username}/${count}/${sort}`)
      .then(res => res.json())
      .then(data => {
        if (this.myRef.current) {
          this.setState({ data });
        }
      })
      .catch(err => console.log(err));
  }
 
  render() {
    const repos = this.state.data;
    let repoItems;
 
    if (repos) {
      repoItems = repos.slice(0, 5).map(repo => (
        <div key={repo.id} className="card card-body mb-2">
          <div className="row">
            <div className="col-md-6">
              <h4>
                <a href={repo.html_url} className="text-info" target="_blank">
                  {" "}
                  {repo.name}
                </a>
              </h4>
              <p>{repo.description}</p>
            </div>
            <div className="col-md-6">
              
              	<span className="badge badge-info mr-1">
                Stars: { repo.stargazers_count}
              	</span>
              	
              	<span className="badge badge-secondary mr-1">
                Watchers: { repo.watchers_count}
              	</span>
              	
              	<span className="badge badge-success">
                Forks: { repo.forks_count}
                </span>
              
            </div>
          </div>
        </div>
      ));
    }
 
    return (
      <div ref={this.myRef}>
        <hr />
        <h3 className="mb-4">Latest Github Repos</h3>
        {repoItems ? repoItems : undefined}
      </div>
    );
  }
	}


ProfileGithub.propTypes = {
	username: PropTypes.string.isRequired
}

export default ProfileGithub;