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
	}
	componentDidMount() {
    const { username } = this.props;
    const { count, sort } = this.state;
 
    fetch(`/api/profile/github/${username}/${count}/${sort}`)
      .then(res => res.json())
      .then(data => {
        if (this.refs.myRef) {
          this.setState({ data });
          console.log(data)
        }
      })
      .catch(err => console.log(err));
  }
 
  render() {
    const repos = this.state.data;
    let repoItens;
 
    if (repos) {
      repoItens = repos.slice(0, 5).map(repo => (
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
              
                Stars: {repo.stargazers_count}
              
              
                Watchers: {repo.watchers_count}
              
              
                Forks: {repo.forks_count}
              
            </div>
          </div>
        </div>
      ));
    }
 
    return (
      <div ref="myRef">
        <hr />
        <h3 className="mb-4">Latest Github Repos</h3>
        {repoItens ? repoItens : undefined}
      </div>
    );
  }
	}


ProfileGithub.propTypes = {
	username: PropTypes.string.isRequired
}

export default ProfileGithub;