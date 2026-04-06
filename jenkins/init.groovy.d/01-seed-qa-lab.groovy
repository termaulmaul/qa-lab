import hudson.model.User
import hudson.security.FullControlOnceLoggedInAuthorizationStrategy
import hudson.security.HudsonPrivateSecurityRealm
import jenkins.model.Jenkins
import jenkins.install.InstallState
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition
import org.jenkinsci.plugins.workflow.job.WorkflowJob

def jenkins = Jenkins.get()
def adminUsername = "qaadmin"
def adminPassword = "qaadmin123!"
def jobName = "qa-k6-lab"
def repoPath = "/Users/maul/github/qa-lab"
def workspacePath = "/workspace/qa-lab"

def ensureSecurity = {
    def realm = jenkins.getSecurityRealm()
    if (!(realm instanceof HudsonPrivateSecurityRealm)) {
        realm = new HudsonPrivateSecurityRealm(false)
        jenkins.setSecurityRealm(realm)
    }

    if (User.getById(adminUsername, false) == null) {
        realm.createAccount(adminUsername, adminPassword)
        println("Created Jenkins admin user: ${adminUsername}")
    }

    def strategy = jenkins.getAuthorizationStrategy()
    if (!(strategy instanceof FullControlOnceLoggedInAuthorizationStrategy)) {
        def auth = new FullControlOnceLoggedInAuthorizationStrategy()
        auth.setAllowAnonymousRead(false)
        jenkins.setAuthorizationStrategy(auth)
    }

    jenkins.setInstallState(InstallState.INITIAL_SETUP_COMPLETED)
    jenkins.save()
}

def pipelineScript = new File("${workspacePath}/Jenkinsfile").text

def ensureJob = {
    def job = jenkins.getItem(jobName)
    if (job == null) {
        job = jenkins.createProject(WorkflowJob, jobName)
        println("Created Jenkins job: ${jobName}")
    }

    job.setDefinition(new CpsFlowDefinition(pipelineScript, true))
    job.setDisplayName(jobName)
    job.save()
}

ensureSecurity()
ensureJob()
