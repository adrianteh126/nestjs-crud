import { Test } from '@nestjs/testing'
import * as pactum from 'pactum'
import { AppModule } from '../src/app.module'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { PrismaService } from '../src/prisma/prisma.service'
import { AuthDto } from '../src/auth/dto'
import { EditUserDto } from '../src/user/dto'
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto'

describe('App e2e', () => {
  let app: INestApplication
  let prisma: PrismaService
  const port = 3333
  const baseUrl = `http://localhost:${port}`

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true
      })
    )
    await app.init()
    await app.listen(port)

    prisma = app.get(PrismaService)
    await prisma.cleanDb()

    pactum.request.setBaseUrl(baseUrl)
  })

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@email.com',
      password: 'secrect-password'
    }

    describe('Signup', () => {
      it('should throw exception if email empty', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })

      it('should throw exception if password empty', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody({
            email: dto.email
          })
          .expectStatus(400)
      })

      it('should throw exception if no body', () => {
        return pactum.spec().post(`/auth/signup`).expectStatus(400)
      })

      it('should signup', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody(dto)
          .expectStatus(201)
      })
    })

    describe('Signin', () => {
      it('should throw exception if email empty', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })

      it('should throw exception if password empty', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody({
            email: dto.email
          })
          .expectStatus(400)
      })

      it('should throw exception if no body', () => {
        return pactum.spec().post(`/auth/signin`).expectStatus(400)
      })

      it('should signin', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
      })
    })
  })

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
      })
    })

    describe('Edit user', () => {
      const dto: EditUserDto = {
        email: 'another@email.com',
        firstName: 'anotherFirstName',
        lastName: 'anotherLastName'
      }

      it('should edit user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.email)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName)
      })
    })
  })

  describe('Bookmarks', () => {
    describe('Get empty bookmark', () => {
      it('should get bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectBody([])
      })
    })

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: "adrian126's github",
        description: "Adrian's github profile",
        link: 'https://github.com/adrianteh126'
      }

      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id')
      })
    })

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectJsonLength(1)
      })
    })

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
      })
    })

    describe('Edit bookmark', () => {
      const dto: EditBookmarkDto = {
        title: 'Edited title',
        description: 'Edited description',
        link: 'https://youtu.be/dQw4w9WgXcQ?si=JIMWwj3zoz6mIZuc'
      }

      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description)
          .expectBodyContains(dto.link)
      })
    })

    describe('Delete bookmark', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(204)
      })

      it('should get empty bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectJsonLength(0)
      })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
