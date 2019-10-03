module.exports = {
  prompt: async (prompt, options) => {
    return prompt({
      type: 'input',
      name: 'name',
      initial: options.name,
      message: 'Project name',
    });
  },
  exec: async (exec, prompt, options) => {
    const pm = (await prompt({
      type: 'autocomplete',
      name: 'pm',
      message: 'Please select your package manager',
      choices: ['npm', 'yarn'],
    })).pm;
    try {
      const result = await exec(`${pm}`);
      console.log('result:', result);
    } catch (err) {
      console.log(err);
    }
  },
};
