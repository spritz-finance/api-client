#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const VALID_BUMP_TYPES = ['major', 'minor', 'patch']

function showUsage() {
    console.log('Usage: node bump.js <major|minor|patch>')
    console.log('  major: 1.0.0 -> 2.0.0')
    console.log('  minor: 1.0.0 -> 1.1.0')
    console.log('  patch: 1.0.0 -> 1.0.1')
    process.exit(1)
}

function bumpVersion(currentVersion, bumpType) {
    const [major, minor, patch] = currentVersion.split('.').map(Number)
    
    switch (bumpType) {
        case 'major':
            return `${major + 1}.0.0`
        case 'minor':
            return `${major}.${minor + 1}.0`
        case 'patch':
            return `${major}.${minor}.${patch + 1}`
        default:
            throw new Error(`Invalid bump type: ${bumpType}`)
    }
}

function main() {
    const bumpType = process.argv[2]
    
    if (!bumpType || !VALID_BUMP_TYPES.includes(bumpType)) {
        showUsage()
    }
    
    try {
        // Read current package.json
        const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
        const currentVersion = packageJson.version
        
        // Calculate new version
        const newVersion = bumpVersion(currentVersion, bumpType)
        
        console.log(`Bumping version from ${currentVersion} to ${newVersion}`)
        
        // Update package.json
        packageJson.version = newVersion
        writeFileSync('package.json', JSON.stringify(packageJson, null, 4) + '\n')
        
        // Stage the change
        execSync('git add package.json', { stdio: 'inherit' })
        
        // Create commit
        const commitMessage = `Bump version to ${newVersion}`
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })
        
        console.log(`✅ Version bumped to ${newVersion} and committed`)
        
    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

main()