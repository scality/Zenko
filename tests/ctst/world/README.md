# CLI-testing

## Worlds folder

World, or sometimes context, is an isolated scope for each scenario, exposed to
the steps and most hooks as this. It allows you to set variables in one step and
recall them in a later step. All variables set this way are discarded when the
scenario concludes. It is managed by a world class, either the default one or
one you create. Each scenario is given an new instance of the class when the
test starts, even if it is a retry run.

For more information, see [CucumberJS World documentation](https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/world.md).
