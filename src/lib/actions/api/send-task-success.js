const { errors, status, parameters } = require('../../../constants');

function sendTaskSuccess(params, activities) {
  /* check request parameters */
  if (typeof params.output !== 'string' || params.output.length > parameters.output.MAX) {
    throw new Error(`${errors.common.INVALID_PARAMETER_VALUE}: --task-output`);
  }
  if (typeof params.taskToken !== 'string'
    || params.taskToken.length < parameters.token.MIN
    || params.taskToken.length > parameters.token.MAX
  ) {
    throw new Error(`${errors.common.INVALID_PARAMETER_VALUE}: --task-token`);
  }

  /* execute action */
  let output;
  try {
    output = JSON.parse(params.output);
  } catch (e) {
    throw new Error(errors.sendTaskSuccess.INVALID_OUTPUT);
  }

  let task;
  let activity;
  activities.forEach((a) => {
    a.tasks.forEach((t) => {
      if (t.taskToken === params.taskToken) {
        activity = a;
        task = t;
      }
    });
  });
  if (!task) {
    throw new Error(errors.sendTaskSuccess.TASK_DOES_NOT_EXIST);
  } else if (task.status === status.activity.TIMED_OUT) {
    throw new Error(errors.sendTaskSuccess.TASK_TIMED_OUT);
  }

  return {
    activityArn: activity.activityArn,
    taskToken: task.taskToken,
    output,
    response: null,
  };
}

module.exports = sendTaskSuccess;
