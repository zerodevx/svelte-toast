/* eslint-env mocha */
/* global cy, expect */

describe('Integration Tests', () => {
  before(() => cy.visit('/'))

  afterEach(() => cy.wait(500))

  it('Displays a toast', () => {
    cy.get('[data-btn=default]')
      .click()
      .get('._toastBtn')
      .click()
  })

  it('Displays colored toast', () => {
    cy.get('[data-btn=green]')
      .click()
      .get('._toastItem')
      .should('have.css', 'background-color', 'rgb(72, 187, 120)')
      .get('._toastBtn')
      .click()
  })

  it('Displays rich HTML', () => {
    cy.get('[data-btn=richHtml]')
      .click()
      .get('._toastItem')
      .find('a')
      .get('._toastBtn')
      .click()
  })

  it('Can change duration', () => {
    cy.window()
      .invoke('toast.push', 'Test', { duration: 1000 })
      .get('._toastItem')
      .wait(1500)
      .should('not.exist')
  })

  it('Can be non-dismissable then popped', () => {
    cy.get('[data-btn=nonDismissable]')
      .click()
      .get('._toastBtn')
      .should('not.exist')
      .get('[data-btn=removeLastToast]')
      .click()
      .wait(500)
      .get('._toastItem')
      .should('not.exist')
  })

  it('Flips progress bar', () => {
    cy.get('[data-btn=flipProgressBar]')
      .click()
      .get('._toastBar')
      .then($bar => {
        const old = parseFloat($bar.val())
        cy.wait(500).then(() => {
          expect(parseFloat($bar.val())).to.be.above(old)
          cy.get('._toastBtn').click()
        })
      })
  })

  it('Dynamically update progress bar', () => {
    cy.window()
      .invoke('toast.push', 'Test', { duration: 1, initial: 0, progress: 0 })
      .then(id => {
        cy.get('._toastBar').then($bar => {
          expect($bar.val()).to.equal(0)
          cy.window().invoke('toast.set', id, { progress: 0.2 }).wait(50).then(() => {
            expect(parseFloat($bar.val())).to.equal(0.2)
            cy.get('._toastBtn').click()
          })
        })
      })
  })

  it('Changes default colors', () => {
    cy.get('[data-btn=changeDefaultColors]')
      .click()
      .get('._toastItem')
      .should('have.css', 'background-color', 'rgba(255, 255, 255, 0.95)')
      .get('._toastBtn')
      .click()
  })

  it('Positions to bottom', () => {
    cy.get('[data-btn=positionToBottom]')
      .click()
      .get('._toastItem')
      .should('have.css', 'bottom', '0px')
      .get('._toastBtn')
      .click()
  })

  it('Uses component', () => {
    cy.get('[data-btn=useComponent]')
      .click()
      .get('._toastItem span')
      .should('have.text', 'I am a Dummy.svelte component with property foo=bar')
      .get('._toastBtn')
      .click()
  })

  it('Restores defaults', () => {
    cy.get('[data-btn=restoreDefaults]')
      .click()
      .get('._toastItem')
      .should('have.css', 'right', '0px')
      .and('have.css', 'background-color', 'rgba(66, 66, 66, 0.9)')
      .get('._toastBtn')
      .click()
  })
})
