const baseURL = (axios) => {
  return axios.create({
    baseURL: 'http://localhost:5000/taxonomyMarkupItems',
  });
};

const getProject = (id) => {
  return baseURL(axios)
    .get(`/${id}`)
    .then((res) => {
      return res.data.markup;
    });
};

const postProject = (projectData) => {
  return baseURL(axios)
    .post(`/`, { markup: projectData })
    .then((res) => {
      console.log(res.data);
      //return res.data;
    });
};

const putProject = (id, projectData) => {
  console.log('put');
  return baseURL(axios)
    .put(`/${id}`, { markup: projectData })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
};

// const patchComment = (comment_id) => {
//   return ncNewsApi
//     .patch(`/comments/${comment_id}`, { inc_votes: 1 })
//     .then((res) => {
//       return res.data;
//     });
// };

// const deleteComment = (comment_id) => {
//   return ncNewsApi.delete(`/comments/${comment_id}`).then((res) => {
//     return res.data;
//   });
// };

// const getTopics = () => {
//   return ncNewsApi.get(`/topics`).then((res) => {
//     return res.data;
//   });
// };

export { getProject, postProject, putProject };
