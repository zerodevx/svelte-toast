/* eslint-env mocha */
/* global Cypress, cy, expect */

describe('Integration Tests', () => {
  before(() => cy.visit('/'))

  afterEach(() => cy.wait(500))

  it('Displays a toast', () => {
    cy.get('[data-btn=default]').click().get('._toastBtn').click()
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
    cy.get('[data-btn=richHtml]').click().get('._toastItem').find('a').get('._toastBtn').click()
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
      .then(($bar) => {
        const old = parseFloat($bar.val())
        cy.wait(500).then(() => {
          expect(parseFloat($bar.val())).to.be.above(old)
          cy.get('._toastBtn').click()
        })
      })
  })

  it('Dynamically update progress bar', () => {
    cy.window()
      .invoke('toast.push', 'Test', { duration: 1, initial: 0, next: 0 })
      .then(($id) => {
        cy.get('._toastBar').then(($bar) => {
          expect($bar.val()).to.equal(0)
          cy.window()
            .invoke('toast.set', $id, { next: 0.2 })
            .wait(50)
            .then(() => {
              expect(parseFloat($bar.val())).to.equal(0.2)
              cy.get('._toastBtn').click()
            })
        })
      })
  })

  it('Allows backward compatibility for `progress` key', () => {
    cy.window()
      .invoke('toast.push', 'Test', { duration: 1, initial: 0, progress: 0 })
      .then(($id) => {
        cy.get('._toastBar').then(($bar) => {
          expect($bar.val()).to.equal(0)
          cy.window()
            .invoke('toast.set', $id, { progress: 0.2 })
            .wait(50)
            .then(() => {
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
      .should('have.css', 'background-color', 'rgba(245, 208, 254, 0.95)')
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

  it('Restores defaults', () => {
    cy.get('[data-btn=restoreDefaults]')
      .click()
      .get('._toastItem')
      .should('have.css', 'right', '0px')
      .and('have.css', 'background-color', 'rgba(66, 66, 66, 0.9)')
      .get('._toastBtn')
      .click()
  })

  it('Clears all active toasts', () => {
    Cypress._.times(3, () => {
      cy.get('[data-btn=default]').click()
    })
    cy.get('._toastItem').should(($e) => {
      expect($e).to.have.length(3)
    })
    cy.window().invoke('toast.pop', 0).get('._toastItem').should('not.exist')
  })

  it('push() accepts both string and object', () => {
    cy.window()
      .invoke('toast.push', 'Test')
      .get('._toastItem')
      .contains('Test')
      .window()
      .invoke('toast.pop')
      .get('._toastItem')
      .should('not.exist')
      .window()
      .invoke('toast.push', '{"msg":"Test2"}')
      .get('._toastItem')
      .contains('Test2')
      .window()
      .invoke('toast.pop')
  })

  it('Pushes messages to correct container target', () => {
    cy.get('[data-btn=createNewToastContainer]')
      .click()
      .get('._toastItem')
      .should('have.css', 'top', '0px')
      .get('._toastBtn')
      .click()
  })

  it('Removes all toasts from selected container target', () => {
    Cypress._.times(3, () => {
      cy.get('[data-btn=createNewToastContainer]').click()
      cy.get('[data-btn=default]').click()
    })
    cy.get('[data-btn=removeAllToastsFromContainer]')
      .click()
      .get('._toastItem')
      .contains('Hello')
      .should('not.contain', 'NEW:')
      .window()
      .invoke('toast.pop', 0)
  })

  it('Renders custom component and is reactive', () => {
    cy.get('[data-btn=sendComponentAsAMessage]')
      .click()
      .get('._toastItem h1')
      .should('have.text', 'Test Reactivity')
      .get('[data-btn=default]')
      .click()
      .get('[data-btn=dummyAccept')
      .click()
      .get('._toastItem h1')
      .should('not.exist')
      .window()
      .invoke('toast.pop', 0)
  })

  it('Pauses on hover', () => {
    cy.get('[data-btn=pauseOnMouseHover]')
      .click()
      .get('._toastItem')
      .trigger('mouseenter')
      .get('._toastBar')
      .then(($bar) => {
        const old = parseFloat($bar.val())
        cy.wait(50).then(() => {
          expect(parseFloat($bar.val())).to.equal(old)
        })
      })
      .get('._toastItem')
      .trigger('mouseleave')
      .get('._toastBar')
      .then(($bar) => {
        const old = parseFloat($bar.val())
        cy.wait(50)
          .then(() => {
            expect(parseFloat($bar.val())).to.be.below(old)
          })
          .get('._toastBtn')
          .click()
      })
  })

  it('Does not pause on hover if `pausable` is false', () => {
    cy.get('[data-btn=default]')
      .click()
      .get('._toastItem')
      .trigger('mouseenter', { force: true })
      .get('._toastBar')
      .then(($bar) => {
        const old = parseFloat($bar.val())
        cy.wait(50).then(() => {
          expect(parseFloat($bar.val())).to.be.below(old)
        })
      })
      .get('._toastItem')
      .trigger('mouseleave', { force: true })
      .get('._toastBar')
      .then(($bar) => {
        const old = parseFloat($bar.val())
        cy.wait(50)
          .then(() => {
            expect(parseFloat($bar.val())).to.be.below(old)
          })
          .get('._toastBtn')
          .click()
      })
  })

  it('Passes pausable edge case when `next` is changed on hover', () => {
    cy.window()
      .invoke('toast.push', 'test', { pausable: true, duration: 50 })
      .then(($id) => {
        cy.get('._toastItem')
          .trigger('mouseenter', { force: true })
          .window()
          .invoke('toast.set', $id, { next: 0.1 })
          .wait(100)
          .get('._toastBar')
          .then(($bar) => {
            expect(parseFloat($bar.val())).to.equal(0.1)
            cy.get('._toastBtn').click()
          })
      })
  })

  it('Runs callback when toast is popped', () => {
    cy.get('[data-btn=runCallbackOnToastRemoval]')
      .click()
      .get('._toastItem')
      .contains('Wait for it')
      .get('._toastBtn')
      .click()
      .wait(500)
      .get('._toastItem')
      .contains('callback has been executed')
      .get('._toastBtn')
      .click()
  })

  it('Runs callback when toast is popped programatically', () => {
    cy.get('[data-btn=runCallbackOnToastRemoval]')
      .click()
      .get('._toastItem')
      .contains('Wait for it')
      .window()
      .invoke('toast.pop')
      .wait(500)
      .get('._toastItem')
      .contains('callback has been executed')
      .get('._toastBtn')
      .click()
  })

  it('Adds and merges user-defined classes', () => {
    cy.get('[data-btn=styleWithUserDefinedClasses]')
      .click()
      .get('._toastItem')
      .should('have.css', 'background-color', 'rgb(66, 153, 225)')
      .get('._toastContainer li')
      .should('have.class', 'custom')
      .and('have.class', 'merge1')
      .and('have.class', 'merge2')
      .get('._toastBtn')
      .click()
  })

  it('Toggles pause and resume on visibilitychange', () => {
    cy.get('[data-btn=default]')
      .click()
      .document()
      .then((doc) => {
        cy.stub(doc, 'hidden').value(true)
      })
      .document()
      .trigger('visibilitychange')
      .get('._toastBar')
      .then(($bar) => {
        const old = parseFloat($bar.val())
        cy.wait(500).then(() => {
          expect(parseFloat($bar.val())).to.be.equal(old)
        })
      })
      .document()
      .then((doc) => {
        cy.stub(doc, 'hidden').value(false)
      })
      .document()
      .trigger('visibilitychange')
      .get('._toastBar')
      .then(($bar) => {
        const old = parseFloat($bar.val())
        cy.wait(500).then(() => {
          expect(parseFloat($bar.val())).to.be.below(old)
        })
      })
      .get('._toastBtn')
      .click()
  })
})
